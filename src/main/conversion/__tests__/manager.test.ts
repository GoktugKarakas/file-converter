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

function makeRequest(name: string, outputDirectory = path.resolve('output')): ConversionRequest {
  return {
    inputPath: path.resolve('input', name),
    outputDirectory,
    targetFormat: 'pdf'
  }
}

function makeEngine(
  options: {
    id?: string
    available?: boolean
    availabilityError?: Error
    supports?: (source: string, target: string) => boolean
    convert?: (request: ConversionRequest) => Promise<ConversionResult>
  } = {}
): {
  engine: ConversionEngine
  calls: {
    availability: number
    supports: Array<{ source: string; target: string }>
    conversions: ConversionRequest[]
  }
} {
  const calls = {
    availability: 0,
    supports: [] as Array<{ source: string; target: string }>,
    conversions: [] as ConversionRequest[]
  }

  const engine: ConversionEngine = {
    id: options.id ?? 'libre-office',
    async isAvailable() {
      calls.availability++
      if (options.availabilityError) throw options.availabilityError
      return options.available ?? true
    },
    supports(source, target) {
      calls.supports.push({ source, target })
      return options.supports?.(source, target) ?? (source === 'docx' && target === 'pdf')
    },
    async convert(request) {
      calls.conversions.push(request)
      if (options.convert) return options.convert(request)
      return {
        inputPath: request.inputPath,
        outputPath: path.join(
          request.outputDirectory,
          `${path.parse(request.inputPath).name}.${request.targetFormat}`
        ),
        engine: engine.id
      }
    }
  }

  return { engine, calls }
}
