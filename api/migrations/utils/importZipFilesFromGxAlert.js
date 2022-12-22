const _ = require('lodash')
const Promise = require('bluebird')
const path = require('path')
const fs = require('fs')
const AdmZip = require('adm-zip')

const { knex } = require('../../src/db')
const logger = require('../../src/shared/logger')
const config = require('../../src/config')

async function importZipFilesFromGxAlert() {
  const folderAbsolutePath = config.file.import.gxAlert.directoryName
  if (!fs.existsSync(folderAbsolutePath)) {
    const error = `Can not find folder path "${folderAbsolutePath}". Check if prop import.gxalert.directory is defined in .env file.`
    logger.error(error, { reLabel: 'gxAlertImport:importZipFilesFromFolder' })
    return { error }
  }

  const totalFilesSaved = await decompressAllZipFiles(folderAbsolutePath)

  return {
    totalFilesSaved,
  }
}

// ------------------------------------------------------------------------
async function decompressAllZipFiles(folderAbsolutePath) {
  const reLabel = 'gxAlertImport:decompressZip'
  logger.info(`Start processing folder '${folderAbsolutePath}' with GxAlert zip files`, {
    reLabel,
  })
  /**
   * loop through zip files and save each in table
   */
  let totalZipFiles = 0
  let totalJsonFiles = 0
  const dirItems = fs.readdirSync(folderAbsolutePath)
  await Promise.each(dirItems, async (fileName, index) => {
    const absolutePath = path.join(folderAbsolutePath, fileName)
    if (absolutePath.endsWith('.zip')) {
      logger.info(`Unzipping file ${index + 1}/${dirItems.length} - ${fileName}`, { reLabel })

      totalZipFiles += 1

      const dirAbsolutePath = absolutePath.substring(0, absolutePath.length - 4)
      if (!fs.existsSync(dirAbsolutePath)) {
        fs.mkdirSync(dirAbsolutePath)
      }

      const zip = new AdmZip(absolutePath)
      const zipEntries = zip.getEntries()
      logger.info(`Zip file contains ${zipEntries.length} files, extracting all.`, { reLabel })
      /**
       * json files are independent - so run all in parallel in a racing condition for
       * better performance
       */
      await Promise.all(
        zipEntries.map(async (zipEntry, jsonFileIndex) => {
          if (!zipEntry.isDirectory && zipEntry.entryName.endsWith('.json')) {
            const now = new Date().toISOString()
            const fileAbsolutePath = path.join(dirAbsolutePath, zipEntry.entryName)
            const content = zipEntry.getData().toString('utf8')
            try {
              fs.writeFileSync(fileAbsolutePath, content)
              /**
               * JSON file name is a GxAlert test id
               */
              const gxAlertTestId = +path.basename(fileAbsolutePath, '.json')
              /**
               * just in case - proceed only files with name as integer
               */
              if (_.isNumber(gxAlertTestId) && gxAlertTestId > 0) {
                /**
                 * store file reference in GxAlertImport
                 */
                const payload = {
                  fileFullPath: fileAbsolutePath,
                  gxAlertTestId,
                  status: null,
                  error: null,
                  updatedOn: now,
                  createdOn: now,
                }
                const fileNumberOutOf = `${jsonFileIndex + 1} / ${zipEntries.length}`
                const id = await knex('GxAlertImport').where({ gxAlertTestId }).first('id')
                if (id) {
                  await knex('GxAlertImport').update(payload).where({ gxAlertTestId })
                  logger.info(`Updated - (${fileNumberOutOf}) ${fileAbsolutePath}.`, { reLabel })
                } else {
                  await knex('GxAlertImport').insert(payload)
                  logger.info(`Inserted - (${fileNumberOutOf}) ${fileAbsolutePath}.`, { reLabel })
                }
              }
              totalJsonFiles += 1
            } catch (err) {
              console.error(err)
              logger.error(err, { reLabel })
            }
          }
        })
      )
      logger.info(`So far total processed ${totalZipFiles} zip files and extracted ${totalJsonFiles} files.`, {
        reLabel,
      })
    }
  })
}

importZipFilesFromGxAlert().then(
  () => process.exit(0),
  err => {
    logger.error(err)
    process.exit(1)
  }
)
