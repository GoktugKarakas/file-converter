import { contextBridge, ipcRenderer } from 'electron'

import type { ConversionRequest, BatchItemResult } from '../shared/conversion'

const api = {
  selectFiles: (): Promise<string[]> => ipcRenderer.invoke('files:select'),
  selectOutputDirectory: (): Promise<string | null> => ipcRenderer.invoke('files:select-output'),

  convertBatch: (requests: ConversionRequest[]): Promise<BatchItemResult[]> =>
    ipcRenderer.invoke('conversions:batch', requests)
}

contextBridge.exposeInMainWorld('api', api)
