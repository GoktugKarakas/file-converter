import assert from 'node:assert/strict'
import path from 'node:path'
import { describe, test } from 'node:test'

import { ConversionManager } from '../manager'
import type { ConversionEngine } from '../types'
import type { ConversionRequest, ConversionResult } from '../../../shared/conversion'
import type { Logger, LogContext } from '../../../shared/logger'

type LoggedEvent = {
  level: 'debug' | 'info' | 'warn' | 'error'
  event: string
  context?: LogContext
}

function makeLogger(): { logger: Logger; events: LoggedEvent[] } {
  const events: LoggedEvent[] = []
  const logger: Logger = {
    debug: (event, context) => events.push({ level: 'debug', event, context }),
    info: (event, context) => events.push({ level: 'info', event, context }),
    warn: (event, context) => events.push({ level: 'warn', event, context }),
    error: (event, context) => events.push({ level: 'error', event, context })
  }
  return { logger, events }
}


