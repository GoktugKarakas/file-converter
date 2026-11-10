import type { ConversionEngine } from '../types'
import { findLibreOfficeExecutable } from '../utils/libre-officeDiscovery'

import type {
  ConversionRequest,
  ConversionResult,
  SupportedFormat
} from '../../../shared/conversion'

export class LibreOfficeEngine implements ConversionEngine {
  readonly id = 'libre-office'

  private executablePath: string | null = null

  async isAvailable(): Promise<boolean> {
    this.executablePath = await findLibreOfficeExecutable()

    return this.executablePath !== null
  }

  supports(source: SupportedFormat, target: SupportedFormat): boolean {
    return source === 'docx' && target === 'pdf'
  }

  async convert(_request: ConversionRequest): Promise<ConversionResult> {
    throw new Error('LibreOffice conversion not implemented yet')
  }
}
