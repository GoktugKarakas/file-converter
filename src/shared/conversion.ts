export const SUPPORTED_FORMATS = ['docx', 'pdf', 'xlsx', 'pptx'] as const

export type SupportedFormat = (typeof SUPPORTED_FORMATS)[number]

export type BatchItemResult =
  | {
      success: true
      result: ConversionResult
    }
  | {
      success: false
      request: ConversionRequest
      error: string
    }
export interface ConversionRequest {
  inputPath: string
  outputDirectory: string
  targetFormat: SupportedFormat
}

export interface ConversionResult {
  inputPath: string
  outputPath: string
  engine: string
}
