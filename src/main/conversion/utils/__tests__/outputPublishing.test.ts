import { afterEach, beforeEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { publishOutput } from '../outputPublishing'

describe('publishOutput', () => {
  let workspace: string
  let temporaryPath: string
  let finalPath: string

  beforeEach(async () => {
    workspace = await mkdtemp(path.join(tmpdir(), 'output-publishing-test-'))

    temporaryPath = path.join(workspace, 'temporary.pdf')
    finalPath = path.join(workspace, 'final.pdf')
  })

  afterEach(async () => {
    await rm(workspace, {
      recursive: true,
      force: true
    })
  })

  it('publishes a valid file successfully', async () => {
    await writeFile(temporaryPath, 'converted content')

    await publishOutput(temporaryPath, finalPath)

    assert.equal(await readFile(finalPath, 'utf8'), 'converted content')

    // Publishing must not remove the original temporary file.
    assert.equal(await readFile(finalPath, 'utf8'), 'converted content')
  })

  it('rejects an existing destination without overwriting it', async () => {
    await writeFile(temporaryPath, 'new content')
    await writeFile(finalPath, 'original content')

    await assert.rejects(publishOutput(temporaryPath, finalPath), /Output already exists/)

    assert(await readFile(finalPath, 'utf8'), 'original content')
  })

  it('rejects a missing temporary file', async () => {
    await assert.rejects(publishOutput(temporaryPath, finalPath), { code: 'ENOENT' })
  })

  it('rejects an empty temporary file', async () => {
    await writeFile(temporaryPath, '')

    await assert.rejects(
      publishOutput(temporaryPath, finalPath),
      /Conversion produced an invalid output file\./
    )
  })

  it('allows only one concurrent publication to the same destination', async () => {
    const sourceA = path.join(workspace, 'source-a.pdf')
    const sourceB = path.join(workspace, 'source-b.pdf')

    await writeFile(sourceA, 'content A')
    await writeFile(sourceB, 'content B')

    const results = await Promise.allSettled([
      publishOutput(sourceA, finalPath),
      publishOutput(sourceB, finalPath)
    ])

    const successes = results.filter((result) => result.status === 'fulfilled')

    const failures = results.filter((result) => result.status === 'rejected')

    assert.equal(successes.length, 1)
    assert.equal(failures.length, 1)

    const finalContent = await readFile(finalPath, 'utf8')

    assert.ok(['content A', 'content B'].includes(finalContent))

    // The losing source must not modify the winning output.
    assert(await readFile(sourceA, 'utf8'), 'content A')
    assert(await readFile(sourceB, 'utf8'), 'content B')
  })
})
