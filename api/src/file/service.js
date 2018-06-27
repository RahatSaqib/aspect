const config = require('../config')
const path = require('path')
const { createWriteStream } = require('fs')
const { ensureFile } = require('fs-extra')

async function createStreamFromFileReference(knex, fileReferenceId) {
  const refPath = await getPathFromFileReferenceId(knex, fileReferenceId)
  if (refPath != null) {
    await ensureFile(refPath)
    return createWriteStream(refPath)
  }
  return null
}

async function getPathFromFileReferenceId(knex, fileReferenceId) {
  const ref = await knex('FileReference')
    .where({ id: fileReferenceId })
    .first('name')
  if (ref != null) {
    const refPath = path.join(
      config.file.reference.directory,
      String(fileReferenceId),
      ref.name
    )
    return refPath
  }
  return null
}

module.exports = {
  createStreamFromFileReference,
  getPathFromFileReferenceId,
}
