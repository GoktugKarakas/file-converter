import { ipcMain } from 'electron'

import { ConversionManager } from '../conversion/manager'
import { LibreOfficeEngine } from '../conversion/adapters/libre-office'
import { isSupportedFormat } from '../conversion/utils/fileValidation'
import { logger } from '../services/logger'

import type { ConversionRequest } from '../../shared/conversion'

function isConversionRequest(value: unknown): value is ConversionRequest {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const request = value as Record<string, unknown>

  return (
    typeof request.inputPath === 'string' &&
    request.inputPath.length > 0 &&
    typeof request.outputDirectory == 'string' &&
    request.outputDirectory.length > 0 &&
    isSupportedFormat(request.targetFormat)
  )
}

export function registerConversionHandlers(): void {
  const manager = new ConversionManager([new LibreOfficeEngine(logger)], logger)

  ipcMain.handle('conversions:batch', async (_event, requests: unknown[]) => {
    if (!Array.isArray(requests) || requests.length > 100 || !requests.every(isConversionRequest)) {
      throw new Error('Invalid conversion batch requests')
    }
    return manager.convertBatch(requests)
  })
}
