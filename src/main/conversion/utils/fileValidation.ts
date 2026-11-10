import path from 'path'
import { stat } from 'node:fs/promises'

import type { ConversionRequest, SupportedFormat } from '../../../shared/conversion'

export async function validateConversionRequest(
  request: ConversionRequest,
  supports: (source: SupportedFormat, target: SupportedFormat) => boolean
): Promise<string> {
  const { inputPath, outputDirectory, targetFormat } = request

  const sourceFormat = path.extname(inputPath).slice(1).toLowerCase() as SupportedFormat
  if (!supports(sourceFormat, targetFormat)) {
    throw new Error(`Conversion from ${sourceFormat} to ${targetFormat} is not supported.`)
  }

  const inputStats = await stat(outputDirectory)
  if (!inputStats.isDirectory()) {
    throw new Error(`Output directory ${outputDirectory} is not a valid directory.`)
  }

  const outputPath = path.join(outputDirectory, `${path.parse(inputPath).name}.${targetFormat}`)

  try {
    await stat(outputPath)
    throw new Error(`Output file ${outputPath} already exists.`)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err
    }
  }
  return outputPath
}
