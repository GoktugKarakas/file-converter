import { test } from 'node:test'
import assert from 'node:assert/strict'

import { runProcess } from './processRunner'

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
