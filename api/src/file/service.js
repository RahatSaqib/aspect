const config = require('../config')
const path = require('path')
const { createWriteStream } = require('fs')
const { ensureFile } = require('fs-extra')
const { fileStatusToId } = require('../shared/dictionary')

async function createStreamFromFileReference(knex, fileReferenceId) {
  const ref = await knex('FileReference')
    .where({ id: fileReferenceId })
    .first('fileStatusId', 'name')
  const fileStatusIds = await fileStatusToId()
  if (ref != null && ref.fileStatusId === fileStatusIds.Initial) {
    const refPath = path.join(
      config.file.reference.directory,
      String(fileReferenceId),
      ref.name
    )
    await ensureFile(refPath)
    await knex('FileReference').update({
      fileStatusId: fileStatusIds.Pending,
      updatedOn: new Date(),
    })
    return createWriteStream(refPath)
  }
  return null
}

module.exports = {
  createStreamFromFileReference,
}
