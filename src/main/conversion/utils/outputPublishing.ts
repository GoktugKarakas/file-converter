import { link, stat } from 'node:fs/promises'

export async function publishOutput(temporaryPath: string, finalPath: string): Promise<void> {
  const stats = await stat(temporaryPath)

  if (!stats.isFile() || stats.size === 0) {
    throw new Error('Conversion produced an invalid output file.')
  }

  try {
    await link(temporaryPath, finalPath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(`Output already exists: ${finalPath}`, {
        cause: error
      })
    }

    throw error
  }
}
