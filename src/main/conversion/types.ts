import type { ConversionRequest, ConversionResult, SupportedFormat } from '../../shared/conversion'

export interface ConversionEngine {
  readonly id: string

  isAvailable(): Promise<boolean>
  supports(source: string, target: SupportedFormat): boolean
  convert(request: ConversionRequest): Promise<ConversionResult>
}
