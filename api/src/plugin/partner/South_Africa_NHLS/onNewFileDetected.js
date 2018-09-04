const path = require('path')
const _ = require('lodash')
const fs = require('fs-extra')
const unzip = require('unzip2')
const Promise = require('bluebird')
const { readTextFile } = require('../../../shared/io')
const { createUniqueIdForResult } = require('../../../result/service')
const { resultUpdated } = require('../../../result/actions')
const { parseDateOrDefault } = require('../../../shared/date')
const {
  getSingleDevice,
  createNewDevice,
} = require('../../../deviceApi/device')
const { mergeResult } = require('../../../deviceApi/result')

// Called when we see a new file in files/watch/nhls/alereQ/ matching %.csv%
async function onNewFileDetected(
  { filePath, partnerId, deviceTypeId, fileSystemWatcherId },
  { messageContext }
) {
  const lowerFilePath = filePath.toLowerCase()
  const filePathInfo = path.parse(lowerFilePath)
  const directory = _.head(filePathInfo.dir.split(path.sep).reverse())
  if (directory === 'alereq') {
    if (filePathInfo.ext === '.zip' && filePathInfo.name.endsWith('.csv')) {
      await extractFileHere(filePath)
    } else if (filePathInfo.ext === '.csv') {
      await messageContext.transact(async knex =>
        processAlereQResults(
          knex,
          filePath,
          partnerId,
          deviceTypeId,
          fileSystemWatcherId,
          messageContext
        )
      )
    }
  }
}

async function extractFileHere(filePath) {
  const filePathInfo = path.parse(filePath)
  return fs
    .createReadStream(filePath)
    .pipe(unzip.Extract({ path: filePathInfo.dir }))
}

async function processAlereQResults(
  knex,
  filePath,
  partnerId,
  deviceTypeId,
  fileSystemWatcherId,
  messageContext
) {
  const fileContents = await readTextFile(filePath)
  const records = fileContents
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
  if (
    !_.isEmpty(records) &&
    records.length > 2 &&
    records[0].startsWith('sep=')
  ) {
    const columnDelimitter = records[0].split('=')[1].trim()
    const columnHeaders = records[1].trim().split(columnDelimitter)
    if (
      !_.isEqual(columnHeaders, [
        'Result No',
        'Device Serial',
        'Test Name',
        'Cartridge ID',
        'Sample ID',
        'HIV-1 M/N',
        'HIV-1 O',
        'HIV-2',
        'Error Code',
        'Operator',
        'Timestamp',
        'Sample Detection',
        'Device',
        'HIV-1 Positive Control',
        'HIV-2 Positive Control',
        'Negative Control',
        'Analysis',
        'Device Software',
      ])
    ) {
      throw new Error(
        `Incompatible file format for AlereQ results. Column headers detected were ${JSON.stringify(
          columnHeaders
        )}`
      )
    }
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

    if (results.length) {
      const importResultsCount = {
        resultsSaved: 0,
        newResultsCreated: 0,
      }
      const [resultsFileImportId] = await knex('ResultsFileImport').insert(
        Object.assign({}, importResultsCount, {
          fileSystemWatcherId,
          filePath,
          recordsInFile: results.length,
          status: 'Started',
          createdOn: new Date(),
        })
      )
      const plugins = []
      if (partnerId) {
        const [partnerPlugin] = await knex('Partner')
          .where('id', partnerId)
          .pluck('plugin')
        if (partnerPlugin) {
          plugins.push(partnerPlugin)
        }
      }
      if (deviceTypeId) {
        const [deviceTypePlugin] = await knex('DeviceType')
          .where('id', deviceTypeId)
          .pluck('plugin')
        if (deviceTypePlugin) {
          plugins.push(deviceTypePlugin)
        }
      }
      const { loadPlugin } = require('../../registration')
      const preProcess = await loadPlugin(plugins, 'preProcessMergeResult')
      const transformPayload = await loadPlugin(
        plugins,
        'transformMergeResultPayload'
      )
      const postProcess = await loadPlugin(plugins, 'postProcessMergeResult')
      messageContext.bindActionCreators({ resultUpdated })
      const devices = {}
      const now = new Date()
      const testNameAssayIdMap = {
        'Alere q HIV-1/2 Detect': 'assayAlereQHiv12Detect',
        // TODO: Add Alere Q HIV-VL Assay when we know what it looks like
      }
      await Promise.each(results, async result => {
        const resultNo = result['Result No']
        const deviceSerial = result['Device Serial']
        const testName = result['Test Name']
        const cartridgeId = result['Cartridge ID']
        const sampleId = result['Sample ID']
        const hiv1MNResult = result['HIV-1 M/N']
        const hiv1OResult = result['HIV-1 O']
        const hiv2Result = result['HIV-1 O']
        const errorCode = result['Error Code']
        const operator = result.Operator
        const timeStamp = parseDateOrDefault(result.Timestamp)
        const sampleDetection = result['Sample Detection']
        const deviceCheck = result.Device
        const hiv1PositiveControl = result['HIV-1 Positive Control']
        const hiv2PositiveControl = result['HIV-2 Positive Control']
        const negativeControl = result['Negative Control']
        const analysisCheck = result.Analysis
        const softwareVersion = result['Device Software']

        if (!testNameAssayIdMap[testName]) {
          const logMessage = `Encountered new, unknown assay in Alere q test file: ${JSON.stringify(
            result
          )}. Skipping record.`
          console.log(logMessage) // eslint-disable-line no-console
          return Promise.resolve()
        }
        let device = devices[deviceSerial]
        if (!device) {
          device = await getSingleDevice(knex, {
            serial: deviceSerial,
            partnerId,
            deviceTypeId,
          })
          if (!device) {
            ;({ device } = await createNewDevice(knex, now, {
              deviceTypeExternalId: 'AlereQ',
              serial: deviceSerial,
              partnerId,
              status: 'approved',
              lastSeenOn: now,
            }))
          }
          devices[deviceSerial] = device
        }

        if (!device.siteId) {
          const matchingSites = await knex
            .from('Site as s')
            .where({
              's.partnerId': partnerId,
            })
            .andWhere(function() {
              this.where({ 's.name': deviceSerial })
                .orWhere({ 's.shortName': deviceSerial })
                .orWhere({ 's.externalId': deviceSerial })
            })
            .select('s.*')
          let siteId
          if (matchingSites.length === 1) {
            siteId = matchingSites[0].id
          } else {
            const newSite = {
              name: deviceSerial,
              shortName: deviceSerial,
              externalId: deviceSerial,
              partnerId,
              createdOn: now,
              updatedOn: now,
            }
            if (newSite.name.length > 255) {
              newSite.name = newSite.name.substr(0, 255)
            }
            if (newSite.shortName.length > 45) {
              newSite.shortName = newSite.shortName.substr(0, 45)
            }
            if (newSite.externalId.length > 255) {
              newSite.externalId = newSite.externalId.substr(0, 255)
            }
            ;[siteId] = await knex.insert(newSite).into('Site')
          }
          await knex('Device')
            .where('id', device.id)
            .update({ siteId })
          device.siteId = siteId
        }

        const resultExternalId = createUniqueIdForResult(
          deviceSerial,
          timeStamp,
          timeStamp,
          sampleId
        )

        const resultPayload = {
          id: resultExternalId,
          sample: { id: sampleId },
          consumable: { serial: cartridgeId },
          instrument: { serial: device.serial },
          sender: { version: softwareVersion, operator },
          rawData: result,
          endedOn: timeStamp,
          data: {
            resultNo,
            deviceSerial,
            testName,
            cartridgeId,
            sampleId,
            hiv1Mn: hiv1MNResult,
            hiv1O: hiv1OResult,
            hiv2: hiv2Result,
            errorCode,
            operator,
            timeStamp,
            sampleDetection,
            device: deviceCheck,
            hiv1PositiveControl,
            hiv2PositiveControl,
            negativeControl,
            analysis: analysisCheck,
            deviceSoftware: softwareVersion,
            sourceFile: filePath,
          },
        }

        resultPayload.assay = { id: 'assayAlereQHiv12Detect' }

        if (errorCode && errorCode !== '0') {
          resultPayload.error = {
            code: errorCode,
          }
        }

        const resultCategory1 = { id: null }
        if (hiv1MNResult === 'Detected' || hiv1OResult === 'Detected') {
          resultCategory1.id = 'Detected'
        } else if (
          hiv1MNResult === 'Undetected' ||
          hiv1OResult === 'Undetected'
        ) {
          resultCategory1.id = 'NotDetected'
        } else if (!errorCode || !errorCode === '0') {
          resultCategory1.id = 'Error'
        }
        const resultCategory2 = { id: null }
        if (hiv2Result === 'Detected') {
          resultCategory2.id = 'Detected'
        } else if (hiv2Result === 'Undetected') {
          resultCategory2.id = 'NotDetected'
        } else if (!errorCode || !errorCode === '0') {
          resultCategory2.id = 'Error'
        }
        resultPayload.category = []
        if (resultCategory1.id) {
          resultPayload.category.push(resultCategory1)
        } else if (resultCategory2.id) {
          resultPayload.category.push({ id: 'Unknown' })
        }
        if (resultCategory2.id) {
          resultPayload.category.push(resultCategory2)
        }

        const pluginContext = {
          knex,
          deviceId: device.id,
          actions: messageContext.actions,
          deviceType: device.deviceType,
          payload: resultPayload,
          now,
        }

        await preProcess(pluginContext)

        const transformedPayload = await transformPayload(pluginContext)

        const { processedResult, existingResult } = await mergeResult(
          knex,
          device.id,
          transformedPayload,
          {
            now,
            sampleId,
          }
        )
        if (!existingResult) {
          importResultsCount.newResultsCreated += 1
        }
        importResultsCount.resultsSaved += 1
        const resultFileImport = Object.assign(
          { updatedOn: new Date() },
          importResultsCount
        )
        if (resultFileImport.resultsSaved === 1) {
          resultFileImport.status = 'Busy'
        }
        await knex('ResultsFileImport')
          .where('id', resultsFileImportId)
          .update(resultFileImport)

        messageContext.resultUpdated(processedResult.id)

        const postProcessResult = await postProcess(
          pluginContext,
          processedResult,
          existingResult
        )
        return postProcessResult
      })
      await knex('ResultsFileImport')
        .where('id', resultsFileImportId)
        .update({ status: 'Completed', updatedOn: new Date() })
    }
  }
}

module.exports = onNewFileDetected
