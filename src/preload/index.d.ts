export interface ConverterAPI {
  selectFiles(): Promise<string[]>
}
declare global {
  interface Window {
    api: ConverterAPI
  }
}
