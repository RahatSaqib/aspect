const path = require('path')
const _ = require('lodash')
const fs = require('fs-extra')
const unzip = require('unzip2')
const { readTextFile } = require('../../../shared/io')

// Called when we see a new file in files/watch/nhls/alereQ/ matching %.csv%
async function onNewFileDetected({ filePath }) {
  const lowerFilePath = filePath.toLowerCase()
  const filePathInfo = path.parse(lowerFilePath)
  const directory = _.head(filePathInfo.dir.split(path.sep).reverse())
  if (directory === 'alereq') {
    if (filePathInfo.ext === '.zip' && filePathInfo.name.endsWith('.csv')) {
      await extractFileHere(filePath)
    } else if (filePathInfo.ext === '.csv') {
      await processResults(filePath)
    }
  }
}

async function extractFileHere(filePath) {
  const filePathInfo = path.parse(filePath)
  return fs
    .createReadStream(filePath)
    .pipe(unzip.Extract({ path: filePathInfo.dir }))
}

async function processResults(filePath) {
  const fileContents = await readTextFile(filePath)
  const records = fileContents.split('\n')
  if (
    !_.isEmpty(records) &&
    records.length > 2 &&
    records[0].startsWith('sep=')
  ) {
    const columnDelimitter = records[0].split('=')[1].trim()
    const columnHeaders = records[1].trim().split(columnDelimitter)
    const results = []
    for (let r = 2; r < records.length; r++) {
      const values = records[r].trim().split(columnDelimitter)
      if (values.length === columnHeaders.length) {
        const result = {}
        for (let c = 0; c < columnHeaders.length; c++) {
          result[columnHeaders[c]] = values[c]
        }
        results.push(result)
      }
    }
    console.log(results)
  }
}

module.exports = onNewFileDetected
