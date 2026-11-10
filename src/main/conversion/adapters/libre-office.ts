import type { ConversionEngine } from '../types'
import { findLibreOfficeExecutable } from '../utils/libre-officeDiscovery'
import { validateConversionRequest } from '../utils/fileValidation'

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

  async convert(request: ConversionRequest): Promise<ConversionResult> {
    // const outputPath = await validateConversionRequest(request, (source, target) =>
    //   this.supports(source, target)
    // )
    await validateConversionRequest(request, (source, target) => this.supports(source, target))

    throw new Error('LibreOffice conversion not implemented yet')
  }
}
