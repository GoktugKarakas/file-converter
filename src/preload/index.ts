import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  selectFiles: (): Promise<string[]> => ipcRenderer.invoke('files:select')
}

contextBridge.exposeInMainWorld('api', api)
