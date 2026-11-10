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

  async convert(request: ConversionRequest): Promise<ConversionResult> {
    const { inputPath, outputDirectory, targetFormat } = request

    // 1. Validate target format.
    // 2. Verify inputPath refers to a regular file.
    // 3. Verify the source extension is supported.
    // 4. Verify outputDirectory is a directory.
    // 5. Construct the destination PDF path.
    // 6. Reject an existing destination.
    // 7. Resolve the LibreOffice executable.
    // 8. Execute conversion.
    // 9. Verify and return the result.

    throw new Error('LibreOffice conversion not implemented yet')
  }
}
