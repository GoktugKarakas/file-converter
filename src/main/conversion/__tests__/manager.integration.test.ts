import assert from 'node:assert/strict'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { afterEach, before, beforeEach, describe, it } from 'node:test'
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'

import { ConversionManager } from '../manager'
import { LibreOfficeEngine } from '../adapters/libre-office'
import type { ConversionRequest } from '../../../shared/conversion'
import type { Logger } from '../../../shared/logger'

const fixturePath = fileURLToPath(
  new URL('../adapters/__tests__/fixtures/sample.docx', import.meta.url)
)

const events: string[] = []
const logger: Logger = {
  debug: (event) => {
    events.push(event)
  },
  info: (event) => {
    events.push(event)
  },
  warn: (event) => {
    events.push(event)
  },
  error: (event) => {
    events.push(event)
  }
}

describe('ConversionManager integration with LibreOffice', () => {
  const engine = new LibreOfficeEngine(logger)
  const manager = new ConversionManager([engine], logger)

  let root: string
  let outputDirectory: string
  let available = false

  before(async () => {
    available = await engine.isAvailable()
  })

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'manager-integration-'))
    outputDirectory = path.join(root, 'output')
    await mkdir(outputDirectory)
    events.length = 0
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })

  async function docxRequest(name: string): Promise<ConversionRequest> {
    const inputPath = path.join(root, `${name}.docx`)
    await copyFile(fixturePath, inputPath)
    return { inputPath, outputDirectory, targetFormat: 'pdf' }
  }

  it('converts two documents and returns usable result metadata', async (t) => {
    if (!available) return t.skip('LibreOffice not installed or discoverable')

    const first = await docxRequest('first')
    const second = await docxRequest('second')
    const results = await manager.convertBatch([first, second])

    assert.equal(results.length, 2)
    assert.ok(results.every((item) => item.success))

    for (const [index, request] of [first, second].entries()) {
      const item = results[index]
      assert.equal(item.success, true)
      if (!item.success) continue // Narrow the discriminated union for TypeScript.

      const expectedOutput = path.join(outputDirectory, `${path.parse(request.inputPath).name}.pdf`)
      assert.deepEqual(item.result, {
        inputPath: request.inputPath,
        outputPath: expectedOutput,
        engine: 'libre-office'
      })

      const bytes = await readFile(expectedOutput)
      assert.ok(bytes.length > 100)
      assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-')
    }

    assert.deepEqual((await readdir(outputDirectory)).sort(), ['first.pdf', 'second.pdf'])
    assert.ok(events.includes('batch.completed'))
  })

  it('continues with a valid document after a corrupted document fails', async (t) => {
    if (!available) return t.skip('LibreOffice not installed or discoverable')

    const first = await docxRequest('first')
    const corruptedPath = path.join(root, 'corrupted.docx')
    await writeFile(corruptedPath, Buffer.from('Not a valid DOCX archive'))
    const corrupted: ConversionRequest = {
      inputPath: corruptedPath,
      outputDirectory,
      targetFormat: 'pdf'
    }
    const last = await docxRequest('last')

    const results = await manager.convertBatch([first, corrupted, last])

    assert.equal(results.length, 3)
    assert.deepEqual(
      results.map((item) => item.success),
      [true, false, true]
    )
    assert.equal(results[1].success, false)
    if (!results[1].success) {
      assert.equal(results[1].request.inputPath, corruptedPath)
      assert.ok(results[1].error.length > 0)
    }

    assert.deepEqual((await readdir(outputDirectory)).sort(), ['first.pdf', 'last.pdf'])
    assert.ok(events.includes('batch.item_failed'))
    assert.ok(events.includes('batch.completed'))
  })

  it('rejects duplicate destination paths before creating any outputs', async () => {
    const first = await docxRequest('report')
    const otherInputDirectory = path.join(root, 'other')
    await mkdir(otherInputDirectory)
    const secondInputPath = path.join(otherInputDirectory, 'report.docx')
    await copyFile(fixturePath, secondInputPath)
    const second: ConversionRequest = {
      inputPath: secondInputPath,
      outputDirectory,
      targetFormat: 'pdf'
    }

    await assert.rejects(manager.convertBatch([first, second]), /Duplicate output destination/)

    assert.deepEqual(await readdir(outputDirectory), [])
    assert.ok(events.includes('batch.duplicate_destination'))
    assert.ok(!events.includes('conversion.started'))
  })
})
