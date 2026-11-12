import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { runProcess } from '../processRunner'

// 1. Successful execution
test('executes a process successfully', async () => {
  const result = await runProcess(process.execPath, [
    '-e',
    'console.log("Hello from child process")'
  ])

  assert.equal(result.exitCode, 0)
  assert.equal(result.stdout.trim(), 'Hello from child process')
  assert.equal(result.stderr, '')
})

// 2. Standard error capture
test('captures stderr without treating it as failure', async () => {
  const result = await runProcess(process.execPath, ['-e', 'console.error("Warning message")'])

  assert.equal(result.exitCode, 0)
  assert.match(result.stderr, /Warning message/)
})

// 3. Nonzero exit code
test('rejects when a process exits unsuccessfully', async () => {
  await assert.rejects(
    runProcess(process.execPath, ['-e', 'process.exit(2)']),
    /Process failed \(code=2/
  )
})

// 4. Missing executable
test('rejects when the executable does not exist', async () => {
  await assert.rejects(runProcess('nonexistent-executable-123456789', []), (error: unknown) => {
    assert.ok(error instanceof Error)
    assert.equal((error as NodeJS.ErrnoException).code, 'ENOENT')
    return true
  })
})

// 5. Process timeout
test('rejects when a process exceeds its timeout', async () => {
  await assert.rejects(
    runProcess(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { timeoutMs: 500 }),
    /Process timed out/
  )
})

// 6. Invalid timeout configuration
test('rejects invalid timeout values', async () => {
  await assert.rejects(runProcess(process.execPath, ['--version'], { timeoutMs: -100 }), RangeError)
})

test('rejects when stdout exceeds the output limit', async () => {
  await assert.rejects(
    runProcess(process.execPath, ['-e', 'process.stdout.write("x".repeat(4096))'], {
      maxOutputBytes: 1024
    }),
    /Process output exceeded/
  )
})

test('rejects when stderr exceeds the output limit', async () => {
  await assert.rejects(
    runProcess(process.execPath, ['-e', 'process.stderr.write("x".repeat(4096))'], {
      maxOutputBytes: 1024
    }),
    /Process output exceeded/
  )
})

test('rejects when combined output exceeds the limit', async () => {
  await assert.rejects(
    runProcess(
      process.execPath,
      ['-e', 'process.stdout.write("a".repeat(700)); ' + 'process.stderr.write("b".repeat(700))'],
      { maxOutputBytes: 1024 }
    ),
    /Process output exceeded/
  )
})

test('rejects invalid output limits', async () => {
  await assert.rejects(
    runProcess(process.execPath, ['--version'], { maxOutputBytes: 0 }),
    RangeError
  )
})

test('rejects invalid termination grace periods', async () => {
  await assert.rejects(runProcess(process.execPath, ['--version'], { killGraceMs: -1 }), RangeError)
})

test('waits for child process closure after timeout', async () => {
  const startedAt = performance.now()

  await assert.rejects(
    runProcess(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
      timeoutMs: 500,
      killGraceMs: 1000
    }),
    /Process timed out/
  )

  const elapsed = performance.now() - startedAt
  assert.ok(elapsed >= 450, `Process rejected too early: ${elapsed}ms`)
})

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH') return false
    throw error
  }
}

function killIfAlive(pid: number | undefined): void {
  if (pid === undefined) return
  try {
    process.kill(pid, 'SIGKILL')
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error
  }
}

test(
  'timeout requests graceful termination with SIGTERM',
  {
    skip: process.platform === 'win32' ? 'POSIX signals only' : false
  },
  async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'graceful-termination-'))
    const signalFile = path.join(directory, 'signal.txt')
    const pidFile = path.join(directory, 'pid.txt')
    let pid: number | undefined

    const script = `
    const fs = require('node:fs')
    process.on('SIGTERM', () => {
      fs.writeFileSync(${JSON.stringify(signalFile)}, 'SIGTERM')
      process.exit(0)
    })
    fs.writeFileSync(${JSON.stringify(pidFile)}, String(process.pid))
    setInterval(() => {}, 1000)
  `

    try {
      await assert.rejects(
        runProcess(process.execPath, ['-e', script], {
          timeoutMs: 800,
          killGraceMs: 1500
        }),
        /Process timed out/
      )

      pid = Number(await readFile(pidFile, 'utf8'))
      assert.equal(await readFile(signalFile, 'utf8'), 'SIGTERM')
      assert.equal(isProcessAlive(pid), false, 'Child is still alive after completion')
    } finally {
      killIfAlive(pid)
      await rm(directory, { recursive: true, force: true })
    }
  }
)

test(
  'timeout escalates to SIGKILL when SIGTERM is ignored',
  {
    skip: process.platform === 'win32' ? 'POSIX signals only' : false
  },
  async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'forced-termination-'))
    const pidFile = path.join(directory, 'pid.txt')
    let pid: number | undefined

    const script = `
    const fs = require('node:fs')
    process.on('SIGTERM', () => {}) // Intentionally ignore graceful shutdown.
    fs.writeFileSync(${JSON.stringify(pidFile)}, String(process.pid))
    setInterval(() => {}, 1000)
  `

    try {
      const startedAt = performance.now()
      await assert.rejects(
        runProcess(process.execPath, ['-e', script], {
          timeoutMs: 800,
          killGraceMs: 400
        }),
        /Process timed out/
      )
      const elapsed = performance.now() - startedAt

      pid = Number(await readFile(pidFile, 'utf8'))
      assert.ok(elapsed >= 1050, `Escalation occurred too early: ${elapsed}ms`)
      assert.equal(isProcessAlive(pid), false, 'SIGKILL did not terminate the child')
    } finally {
      killIfAlive(pid)
      await rm(directory, { recursive: true, force: true })
    }
  }
)
