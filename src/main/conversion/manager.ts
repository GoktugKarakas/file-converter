import path from 'node:path'

import type { Logger } from '../../shared/logger'
import type { ConversionEngine } from './types'
import type { ConversionRequest, BatchItemResult } from '../../shared/conversion'

export class ConversionManager {
  constructor(
    private readonly engines: ConversionEngine[],
    private readonly logger: Logger
  ) {}

  private getEngine(id: string): ConversionEngine | undefined {
    return this.engines.find((engine) => engine.id === id)
  }

  private async selectEngine(preferredEngineId: string): Promise<ConversionEngine | undefined> {
    const engine = this.getEngine(preferredEngineId)

    if (!engine) {
      this.logger.warn('engine.not_found for_id', { engineId: preferredEngineId })
      return undefined
    }

    try {
      if (!(await engine.isAvailable())) {
        this.logger.warn('engine.unavailable', { engineId: preferredEngineId })
        return undefined
      }
    } catch (err) {
      this.logger.error('engine.availability_check_failed', {
        engineId: preferredEngineId,
        error: err instanceof Error ? err.message : String(err)
      })
      return undefined
    }
    return engine
  }

  async convertBatch(
    requests: ConversionRequest[],
    preferredEngineId: string = 'libre-office'
  ): Promise<BatchItemResult[]> {
    const destinations = new Set<string>()
    const results: BatchItemResult[] = []

    for (const request of requests) {
      const outputPath = path.resolve(
        request.outputDirectory,
        `${path.parse(request.inputPath).name}.${request.targetFormat}`
      )

      if (destinations.has(outputPath)) {
        this.logger.warn('batch.duplicate_destination', { outputPath })
        throw new Error(`Duplicate output destination: ${outputPath}`)
      }
      destinations.add(outputPath)
    }

    if (requests.length === 0) {
      return results
    }

    const engine = await this.selectEngine(preferredEngineId)
    if (!engine) {
      for (const request of requests) {
        results.push({
          request,
          success: false,
          error: `Engine '${preferredEngineId}' is unavailable or not registered`
        })
      }
      return results
    }

    this.logger.info('batch.conversion_started', {
      engineId: engine.id,
      total: requests.length
    })

    for (const request of requests) {
      try {
        const sourceFormat = path.extname(request.inputPath).slice(1).toLowerCase()
        if (!engine.supports(sourceFormat, request.targetFormat)) {
          throw new Error(`Unsupported conversion: ${sourceFormat} to ${request.targetFormat}`)
        }

        const result = await engine.convert(request)
        results.push({
          success: true,
          result
        })
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)

        this.logger.error('batch.item_failed', {
          engineId: engine.id,
          inputPath: request.inputPath,
          error
        })

        results.push({
          success: false,
          request,
          error
        })
      }
    }

    const succeeded = results.filter((item) => item.success).length

    this.logger.info('batch.completed', {
      engineId: engine.id,
      total: results.length,
      succeeded,
      failed: results.length - succeeded
    })
    return results
  }
}
