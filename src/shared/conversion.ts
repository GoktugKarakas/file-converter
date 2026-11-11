export type SupportedFormat = 'docx' | 'pdf' | 'xlsx' | 'pptx'
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
