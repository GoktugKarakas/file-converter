import { ipcMain } from 'electron'

import { ConversionManager } from '../conversion/manager'
import { LibreOfficeEngine } from '../conversion/adapters/libre-office'
import { isSupportedFormat } from '../conversion/utils/fileValidation'
import { logger } from '../services/logger'

import type { ConversionRequest } from '../../shared/conversion'
