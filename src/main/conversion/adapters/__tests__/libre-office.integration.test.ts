import path from 'node:path'
import { tmpdir } from 'node:os'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { afterEach, before, beforeEach, describe, it } from 'node:test'
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'

import { LibreOfficeEngine } from '../libre-office'

const fixture = fileURLToPath(new URL('./fixtures/sample.docx', import.meta.url))

describe('LibreOfficeEngine integration', () => {
  const engine = new LibreOfficeEngine()

  let root: string
  let inputPath: string
  let outputDirectory: string
  let available = false

  before(async () => {
    available = await engine.isAvailable()
  })

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'lo-integration-'))
    outputDirectory = path.join(root, 'output')
    await mkdir(outputDirectory)
    inputPath = path.join(root, 'sample.docx')
    await copyFile(fixture, inputPath)
  })

  afterEach(async () => {
    await rm(root, { recursive: true, force: true })
  })
  //Does successfully convert a Docx
  it('converts a DOCX into a nonempty PDF with correct result metadata', async (t) => {
    if (!available) return t.skip('LibreOffice is not installed or discoverable')
    const result = await engine.convert({ inputPath, outputDirectory, targetFormat: 'pdf' })

    const expectedOutputPath = path.join(outputDirectory, 'sample.pdf')

    assert.deepEqual(result, {
      inputPath,
      outputPath: expectedOutputPath,
      engine: 'libre-office'
    })

    const bytes = await readFile(expectedOutputPath)
    assert.ok(bytes.length > 100)
    assert.equal(bytes.subarray(0, 5).toString('ascii'), '%PDF-')
    assert.deepEqual(await readdir(outputDirectory), ['sample.pdf'])
  })

  //Does it refuse to overwrite an existing destination
  it('refuses to overwrite an existing destination', async () => {
    const destination = path.join(outputDirectory, 'sample.pdf')
    const original = Buffer.from('preserve-existing-output')

    await writeFile(destination, original)
    await assert.rejects(
      engine.convert({ inputPath, outputDirectory, targetFormat: 'pdf' }),

      /already exists/
    )
    assert.deepEqual(await readFile(destination), original)
    assert.deepEqual(await readdir(outputDirectory), ['sample.pdf'])
  })
  //Does it reject unsupported format
  it('rejects unsupported input without producing an output', async () => {
    const txtPath = path.join(root, 'notes.txt')

    await writeFile(txtPath, 'not supported')
    await assert.rejects(
      engine.convert({ inputPath: txtPath, outputDirectory, targetFormat: 'pdf' }),

      /not supported/
    )
    assert.deepEqual(await readdir(outputDirectory), [])
  })
  // Does it reject invalid file and clears buffer folder
  it('rejects invalid DOCX data and cleans up the temporary workspace', async (t) => {
    if (!available) return t.skip('LibreOffice is not installed or discoverable')

    await writeFile(inputPath, 'this is not an Office document')
    await assert.rejects(engine.convert({ inputPath, outputDirectory, targetFormat: 'pdf' }))

    assert.deepEqual(await readdir(outputDirectory), [])
  })
})
