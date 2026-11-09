import { dialog, ipcMain } from 'electron'

export function registerFileHandlers(): void {
  ipcMain.handle('files:select', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections']
    })
    return result.canceled ? [] : result.filePaths
  })
}
