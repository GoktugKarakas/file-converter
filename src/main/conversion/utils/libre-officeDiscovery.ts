import { spawn } from 'node:child_process'
import path from 'node:path'
//TODO: revisit other operating systems path-finding of libre office
function getExecutableCandidates(): string[] {
  switch (process.platform) {
    case 'win32':
      return [
        'soffice.com',
        path.join(
          process.env.PROGRAMFILES ?? 'C:\\Program Files',
          'LibreOffice',
          'program',
          'soffice.com'
        ),
        path.join(
          process.env['PROGRAMFILES(X86)'] ?? 'C:\\Program Files (x86)',
          'LibreOffice',
          'program',
          'soffice.com'
        )
      ]

    case 'darwin':
      return ['soffice', '/Applications/LibreOffice.app/Contents/MacOS/soffice']

    case 'linux':
      return ['libreoffice', 'soffice', '/usr/bin/libreoffice', '/usr/bin/soffice']

    default:
      return []
  }
}

function checkExecutable(executable: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const child = spawn(executable, ['--version'], {
      windowsHide: true,
      stdio: 'ignore'
    })

    let timedOut = false

    const timeout = setTimeout(() => {
      timedOut = true
      child.kill()
    }, 5000)

    child.once('error', () => {
      clearTimeout(timeout)
      resolve(false)
    })

    child.once('close', (code) => {
      clearTimeout(timeout)
      resolve(!timedOut && code === 0)
    })
  })
}

export async function findLibreOfficeExecutable(): Promise<string | null> {
  for (const candidate of getExecutableCandidates()) {
    if (await checkExecutable(candidate)) {
      return candidate
    }
  }
  return null
}
