const Promise = require('bluebird')
const fs = require('fs')
const fetch = require('node-fetch')

const { knex } = require('../../src/db')
const logger = require('../../src/shared/logger')
const config = require('../../src/config')

async function handleAllUnprocessedJsonFiles() {
  const items = await knex('GxAlertImport').where({ status: null }).select('*')

  await Promise.each(items, async item => {
    const { fileFullPath, gxAlertTestId } = item
    if (!fs.existsSync(fileFullPath)) {
      logger.error(`Can not find imported JSON file "${fileFullPath}".`, {
        reLabel: 'gxAlertImport:importZipFilesFromFolder',
      })
      return
    }
    /**
     * get JSON file
     */
    // eslint-disable-next-line import/no-dynamic-require
    const jsonObj = require(fileFullPath)
    /**
     * post payload to the same endpoint as GxAlert is doing when forwarding
     * data via job JobSendReceivedDataToAspectDeviceApi
     */
    const response = await fetch(`${config.url}/device`, {
      method: 'POST',
      body: JSON.stringify(jsonObj.Content),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jsonObj.DeviceApiKey}`,
        Accept: 'application/json',
      },
    })
    const respJson = await response.json()
    /**
     * if data processing succeeded then `respJson` is object like { device, result, aspectResultId },
     * but in case of any Boom - it is an object like { statusCode, error, message }, where
     * `statusCode` is any of 4** or 5** code, `error` is an error token like 'Conflict' etc
     * and `message` is a detailed error message
     */
    const { message, aspectResultId } = respJson
    /**
     * store payload for this gxAlertTestId in table GxAlertImport
     */
    let payload
    if (aspectResultId) {
      payload = {
        status: 'done',
        error: null,
        aspectResultId,
        updatedOn: new Date().toISOString(),
      }
    } else {
      payload = {
        status: 'error',
        error: message,
        aspectResultId: null,
        updatedOn: new Date().toISOString(),
      }
    }
    await knex('GxAlertImport').where({ gxAlertTestId }).update(payload)
  })
}

handleAllUnprocessedJsonFiles().then(
  () => process.exit(0),
  err => {
    logger.error(err)
    process.exit(1)
  }
)
