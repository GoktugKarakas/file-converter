import type { ConversionRequest, BatchItemResult } from '../shared/conversion'

export interface ConverterAPI {
  selectFiles(): Promise<string[]>
  selectOutputDirectory(): Promise<string | null>
  convertBatch(requests: ConversionRequest[]): Promise<BatchItemResult[]>
}
declare global {
  interface Window {
    api: ConverterAPI
  }
}
