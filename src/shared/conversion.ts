export type SupportedFormat = 'docx' | 'pdf' //TODO: add other formats

export interface ConversionRequest {
  inputPath: string
  outputDirectory: string
  targetFormat: 'pdf' // TODO: add support for other formats
}

export interface ConversionResult {
  inputPath: string
  outputPath: string
  engine: string
}
