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

describe('ConversionManager.convertBatch', () => {
  test('returns an empty array without checking engine availability for an empty batch', async () => {
    const { logger } = makeLogger()
    const { engine, calls } = makeEngine()
    const manager = new ConversionManager([engine], logger)

    assert.deepEqual(await manager.convertBatch([]), [])
    assert.equal(calls.availability, 0)
    assert.equal(calls.conversions.length, 0)
  })

  test('returns successful conversion results in request order', async () => {
    const { logger, events } = makeLogger()
    const { engine, calls } = makeEngine()
    const manager = new ConversionManager([engine], logger)
    const requests = [makeRequest('first.docx'), makeRequest('second.docx')]

    const results = await manager.convertBatch(requests)

    assert.equal(results.length, 2)
    assert.deepEqual(calls.conversions, requests)
    assert.deepEqual(
      results,
      requests.map((request) => ({
        success: true,
        result: {
          inputPath: request.inputPath,
          outputPath: path.join(
            request.outputDirectory,
            `${path.parse(request.inputPath).name}.pdf`
          ),
          engine: 'libre-office'
        }
      }))
    )
    assert.ok(
      events.some(
        ({ event, context }) =>
          event === 'batch.completed' && context?.succeeded === 2 && context?.failed === 0
      )
    )
  })

  test('continues after a conversion fails and preserves a result for each request', async () => {
    const { logger, events } = makeLogger()
    const requests = [makeRequest('first.docx'), makeRequest('bad.docx'), makeRequest('last.docx')]
    const { engine, calls } = makeEngine({
      async convert(request) {
        if (request.inputPath === requests[1].inputPath) {
          throw new Error('Document is corrupted')
        }
        return {
          inputPath: request.inputPath,
          outputPath: path.join(
            request.outputDirectory,
            `${path.parse(request.inputPath).name}.pdf`
          ),
          engine: 'libre-office'
        }
      }
    })
    const manager = new ConversionManager([engine], logger)

    const results = await manager.convertBatch(requests)

    assert.deepEqual(calls.conversions, requests)
    assert.deepEqual(
      results.map((item) => item.success),
      [true, false, true]
    )
    assert.deepEqual(results[1], {
      success: false,
      request: requests[1],
      error: 'Document is corrupted'
    })
    assert.ok(
      events.some(
        ({ event, context }) =>
          event === 'batch.completed' && context?.succeeded === 2 && context?.failed === 1
      )
    )
  })

  test('reports unsupported source formats without invoking convert for those requests', async () => {
    const { logger } = makeLogger()
    const { engine, calls } = makeEngine()
    const manager = new ConversionManager([engine], logger)
    const requests = [makeRequest('unsupported.txt'), makeRequest('supported.DOCX')]

    const results = await manager.convertBatch(requests)

    assert.deepEqual(
      results.map((item) => item.success),
      [false, true]
    )
    assert.match(results[0].success ? '' : results[0].error, /Unsupported conversion/)
    assert.deepEqual(calls.conversions, [requests[1]])
    assert.deepEqual(calls.supports, [
      { source: 'txt', target: 'pdf' },
      { source: 'docx', target: 'pdf' }
    ])
  })

  test('rejects duplicate destinations before selecting an engine or converting files', async () => {
    const { logger, events } = makeLogger()
    const { engine, calls } = makeEngine()
    const manager = new ConversionManager([engine], logger)
    const requests = [makeRequest('report.docx'), makeRequest('report.pptx')]

    await assert.rejects(manager.convertBatch(requests), /Duplicate output destination/)

    assert.equal(calls.availability, 0)
    assert.equal(calls.conversions.length, 0)
    assert.ok(events.some(({ event }) => event === 'batch.duplicate_destination'))
  })
})
