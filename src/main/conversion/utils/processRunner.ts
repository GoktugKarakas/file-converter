import { spawn } from 'node:child_process'
import { execFile, spawn } from 'node:child_process'

export interface ProcessResult {
  exitCode: number | null
  stdout: string
  stderr: string
}

export interface ProcessOptions {
  timeoutMs?: number
  cwd?: string
  maxOutputBytes?: number
  killGraceMs?: number
}

export function runProcess(
  executable: string,
  args: string[],
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  const { timeoutMs = 30_000, cwd, maxOutputBytes = 1024 * 1024, killGraceMs = 2000 } = options
  const isWindows = process.platform === 'win32'

  for (const [name, value] of Object.entries({
    timeoutMs,
    maxOutputBytes,
    killGraceMs
  })) {
    if (!Number.isSafeInteger(value) || value <= 0) {
      return Promise.reject(new RangeError(`${name} must be a positive integer`))
    }
  }

  return new Promise<ProcessResult>((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      windowsHide: true,
      shell: false,
      detached: !isWindows,
      stdio: ['ignore', 'pipe', 'pipe']
    })

    const stdoutChunks: Buffer[] = []
    const stderrChunks: Buffer[] = []

    let outputBytes = 0
    let failure: Error | null = null
    let settled = false
    let graceTimer: NodeJS.Timeout | undefined

    const requestTermination = (error: Error): void => {
      if (settled || failure) return

      failure = error
      // This may not terminate the entire process
      child.kill('SIGTERM')

      graceTimer = setTimeout(() => {
        if (!settled) {
          child.kill('SIGKILL')
        }
      }, killGraceMs)
    }

    const collectOutput = (chunk: Buffer, destination: Buffer[]): void => {
      if (failure) return

      const remaining = maxOutputBytes - outputBytes

      if (chunk.length > remaining) {
        requestTermination(new Error(`Process output exceeded ${maxOutputBytes} bytes`))
        return
      }

      destination.push(chunk)
      outputBytes += chunk.length
    }

    child.stdout.on('data', (chunk: Buffer) => {
      collectOutput(chunk, stdoutChunks)
    })

    child.stderr.on('data', (chunk: Buffer) => {
      collectOutput(chunk, stderrChunks)
    })

    const timeout = setTimeout(() => {
      requestTermination(new Error(`Process timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    const cleanup = (): void => {
      clearTimeout(timeout)
      if (graceTimer) clearTimeout(graceTimer)
    }

    const finish = (error?: Error, result?: ProcessResult): void => {
      if (settled) return
      settled = true
      cleanup()

      if (error) {
        reject(error)
      } else if (result) {
        resolve(result)
      }
    }

    child.on('error', (error) => {
      if (!failure) failure = error
    })

    child.on('close', (code, signal) => {
      if (failure) {
        finish(failure)
        return
      }

      const stdout = Buffer.concat(stdoutChunks).toString('utf8')
      const stderr = Buffer.concat(stderrChunks).toString('utf8')

      if (code === 0) {
        finish(undefined, {
          exitCode: code,
          stdout,
          stderr
        })
        return
      }

      finish(new Error(`Process failed (code=${code}, signal=${signal}): ${stderr}`))
    })
  })
}
