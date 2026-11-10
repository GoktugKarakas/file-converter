import { spawn } from 'node:child_process'

export interface ProcessResult {
  exitCode: number | null
  stdout: string
  stderr: string
}

export interface ProcessOptions {
  timeoutMs?: number
  cwd?: string
}

export function runProcess(
  executable: string,
  args: string[],
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  const { timeoutMs = 30_000, cwd } = options

  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    return Promise.reject(new RangeError('timeoutMs must be a positive integer'))
  }

  return new Promise<ProcessResult>((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      windowsHide: true,
      shell: false
    })

    let stdout = ''
    let stderr = ''
    let settled = false

    const finish = (error?: Error, result?: ProcessResult): void => {
      if (settled) return
      settled = true

      clearTimeout(timeout)

      if (error) {
        reject(error)
      } else if (result) {
        resolve(result)
      }
    }

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
    })

    const timeout = setTimeout(() => {
      child.kill()

      finish(new Error(`Process timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    child.on('error', (error) => {
      finish(error)
    })

    child.on('close', (code, signal) => {
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
