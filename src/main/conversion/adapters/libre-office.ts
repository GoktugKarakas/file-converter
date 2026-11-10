import type { ConversionEngine } from '../types'
import { spawn } from 'node:child_process'

import type {
  ConversionRequest,
  ConversionResult,
  SupportedFormat
} from '../../../shared/conversion'

export class LibreOfficeEngine implements ConversionEngine {
  readonly id = 'libre-office'

  // TODO: Add a timeout mechanism too
  // NOTE: Windows might not find the libreoffice executable if it's not in the PATH.
  isAvailable(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const child = spawn('soffice', ['--version'])

      child.on('error', () => resolve(false))
      child.on('close', (code) => resolve(code === 0))
    })
  }

  supports(source: SupportedFormat, target: SupportedFormat): boolean {
    return source === 'docx' && target === 'pdf'
  }

  async convert(request: ConversionRequest): Promise<ConversionResult> {
    // TODO: implement conversion
    throw new Error('LibreOffice conversion not implemented yet')
  }
}
