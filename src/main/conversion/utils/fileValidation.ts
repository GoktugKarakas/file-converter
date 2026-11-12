import path from 'path'
import { stat } from 'node:fs/promises'

import type { ConversionRequest } from '../../../shared/conversion'

export async function validateConversionRequest(
  request: ConversionRequest,
  supports: (source: string, target: string) => boolean
): Promise<string> {
  const { inputPath, outputDirectory, targetFormat } = request

  const sourceFormat = path.extname(inputPath).slice(1).toLowerCase()
  if (!supports(sourceFormat, targetFormat)) {
    throw new Error(`Conversion from ${sourceFormat} to ${targetFormat} is not supported.`)
  }

  const inputStats = await stat(inputPath)

  if (!inputStats.isFile()) {
    throw new Error(`Input path ${inputPath} is not a valid file.`)
  }

  const outputStats = await stat(outputDirectory)
  if (!outputStats.isDirectory()) {
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
