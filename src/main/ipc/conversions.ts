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
