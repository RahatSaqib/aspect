const chai = require('chai')
const { format, subDays } = require('date-fns')
const { createTestContext } = require('./utils')
const { knex } = require('../../src/db')

const { deviceHardwareError } = require('../../src/device/actions')
const { waitForIdle, waitForAction } = require('../utils/mqUtils')
const { postToDeviceApi } = require('./utils')
const server = require('../utils/testUtils')

const { assert, expect } = chai

const baseConfig = {
  requirePrinter: 'yes',
  adminPassword: 'pwd123',
  firmwareUpdateRequired: 'no',
}

const context = createTestContext(server, {
  user: 'admin',
  type: 'DaktariVirology',
  partner: 'Partner One',
  baseConfig,
})

const devicePath = '/device'
const logSource = 'GeneXpert'
/**
 * See api/seeds/fixtures/GeneXpertLogs.js for details of GeneXpert
 * log entries which we save in DeviceOperation table
 */
const logDataWithCalibration = {
  externalId: 138, // some unique Id in Logs table in SQLite db on device side
  occurredOn: new Date('2018-11-23 14:13:56'),
  logFileName: 'C:\\GeneXpert\\log\\XpertCal-2015.11.03_15.27.28.028-0.log',
  logLevel: 'INFO',
  details:
    '{"RawText":"<XpertCalServiceProvider>Activation valid days: 45","Errors":[],"Calibrations":[{"Source":"XpertCalServiceProvider","Site":"","Message":"Activation valid days: 45"}]}',
}
const logDataWithErrors = {
  externalId: 139, // some unique Id in Logs table in SQLite db on device side
  occurredOn: new Date('2018-12-02 09:56:56'),
  logFileName: 'C:\\GeneXpert\\log\\XpertCal-2017.10.27_18.02.57.007-1.log',
  logLevel: 'INFO',
  details: JSON.stringify({
    Errors: [
      {
        Message:
          'Cepheid System ID 900001:\r\nHeater Temperature Differential Error.\r\nContact your Authorized Service Provider',
        ErrorCode: '1002',
      },
    ],
    RawText:
      '<BurnCDError>Error Code 1002, Cepheid System ID 900001:\r\nHeater Temperature Differential Error.\r\nContact your Authorized Service Provider',
    Calibrations: [],
  }),
}

describe('Process GeneXpert Logs', () => {
  const getTotalsOfDeviceOperation = async () => {
    const [{ count }] = await knex('DeviceOperation').count('id as count')
    return count
  }
  // helper func to post log
  const postLog = async (deviceAuth, source, data) =>
    server.post(devicePath).set('Authorization', deviceAuth).send({
      log: {
        source,
        data,
      },
    })

  beforeEach(async () => {
    await context.createDeviceWithResult()
  })
  afterEach(context.afterEach)

  it('should create entry with log details in table DeviceOperation', async () => {
    const { apiKey, deviceAuth, deviceId } = context
    assert.isOk(apiKey)
    // initial count of deviceOperation entries
    const totals1 = await getTotalsOfDeviceOperation()

    const logData = logDataWithCalibration
    const res = await postLog(deviceAuth, logSource, logData)
    assert.equal(res.status, 200)

    const totals2 = await getTotalsOfDeviceOperation()
    assert.equal(totals1 + 1, totals2)

    // get stored deviceOperation entry and compare with sent data
    const deviceOperation = await knex('DeviceOperation')
      .orderBy('CreatedOn', 'desc')
      .first()
    assert.equal(deviceOperation.deviceId, deviceId)
    assert.equal(
      format(deviceOperation.startedOn, 'yyyy-MM-dd HH:mm:ss'),
      format(logData.occurredOn, 'yyyy-MM-dd HH:mm:ss')
    )
    const { details: detailsStored } = JSON.parse(deviceOperation.data)
    const detailsSent = JSON.parse(logData.details)
    expect(detailsStored).to.containSubset(detailsSent)
  })

  it('should return 400 if some required props missed for log data', async () => {
    const { apiKey, deviceAuth } = context
    assert.isOk(apiKey)

    const logData = logDataWithCalibration
    let res = await postLog(deviceAuth, logSource, {
      ...logData,
      occurredOn: null,
    })
    assert.equal(res.status, 400)

    res = await postLog(deviceAuth, logSource, {
      ...logData,
      logFileName: null,
    })
    assert.equal(res.status, 400)

    await postLog(deviceAuth, logSource, {
      ...logData,
      logLevel: null,
    })
    assert.equal(res.status, 400)

    await postLog(deviceAuth, logSource, {
      ...logData,
      details: null,
    })
    assert.equal(res.status, 400)
  })

  it('should skip processing log if wrong source specified', async () => {
    const { apiKey, deviceAuth } = context
    assert.isOk(apiKey)
    // initial count of deviceOperation entries
    const totals1 = await getTotalsOfDeviceOperation()

    const logData = logDataWithCalibration
    const res = await postLog(deviceAuth, 'Invalid Source', logData)
    assert.equal(res.status, 200)

    // total number of entries didn't change
    const totals2 = await getTotalsOfDeviceOperation()
    assert.equal(totals1, totals2)
  })

  it('should create entry with Errors in log details and trigger "deviceHardwareError" action', async () => {
    const { apiKey, deviceAuth, deviceId } = context
    assert.isOk(apiKey)
    // initial count of deviceOperation entries
    const totals1 = await getTotalsOfDeviceOperation()
    // helper for getting date N days ago
    const getDateDaysAgo = daysAgo =>
      new Date(format(subDays(new Date(), daysAgo), 'yyyy-MM-dd HH:mm:ss'))

    const logDatas = [
      {
        ...logDataWithErrors,
        externalId: 139,
        occurredOn: getDateDaysAgo(10),
      },
      {
        ...logDataWithErrors,
        externalId: 140,
        occurredOn: getDateDaysAgo(5),
      },
      {
        ...logDataWithErrors,
        externalId: 141,
        occurredOn: getDateDaysAgo(2),
      },
    ]
    // last item sent - it should trigger issue and be referred in db
    const detailsSent = JSON.parse(logDatas[2].details)

    // get device to pass it to action creator deviceHardwareError
    const device = await knex('Device').where('id', deviceId).first()

    // helper func to get all Issue entries for this deviceId and issueType
    const getIssues = deviceId =>
      knex('Issue as i')
        .innerJoin('IssueType as it', 'i.issueTypeId', 'it.id')
        .where('it.externalId', 'HardwareHeaterTemperatureDifferentialError')
        .where('i.deviceId', deviceId)
        .orderBy('i.id', 'desc')
        .select('i.*')

    // get list of all Issues for this device before posting data
    const issuesBefore = await getIssues(deviceId)

    /**
     * See item for "issueType": "HardwareHeaterTemperatureDifferentialError"
     * in api/seeds/fixtures/IssueEventTrigger.json
     *
     * action type for error code 1002
     * */
    const actionType = 'HARDWARE_HEATER_TEMPERATURE_DIFFERENTIAL_ERROR'

    /**
     * post data with error code 1002 within daysPeriod
     *
     * See trigger conditions in api/seeds/fixtures/IssueEventTrigger.json, i.e.
     *  "daysPeriod": 30,
     *  "minResults": 3
     */
    // helper - define action to wait for, post data, asert response, waitFor*
    const postError = async (data, shouldTrigger = false) => {
      const options = {
        startedOn: new Date(format(data.occurredOn, 'yyyy-MM-dd HH:mm:ss')),
        details: JSON.parse(data.details),
      }
      // see calling deviceHardwareError() in api/src/plugin/utils.js in func shouldTriggerHardwareErrorAnalysis()
      const action = deviceHardwareError(device, actionType, options)
      const waitForHardwareError = waitForAction(action)

      const res = await postLog(deviceAuth, logSource, data)
      assert.equal(res.status, 200)

      if (shouldTrigger) {
        // must dispatch needed action to MQ
        await waitForHardwareError
      }
      await waitForIdle()
    }

    // post 1-st error
    await postError(logDatas[0])
    // this does not trigger issue, i.e. Issue table doesn't contain new entries
    let issuesAfter = await getIssues(deviceId)
    assert.equal(issuesBefore.length, issuesAfter.length)

    // post 2-nd error
    await postError(logDatas[1])
    // this also does not trigger issue, i.e. Issue table doesn't contain new entries
    issuesAfter = await getIssues(deviceId)
    assert.equal(issuesBefore.length, issuesAfter.length)

    // post 3-rd error
    await postError(logDatas[2])
    issuesAfter = await getIssues(deviceId)
    // 3rd error triggers issue - Issue table contains just created record with issue details
    assert.equal(issuesBefore.length + 1, issuesAfter.length)

    // -------------------
    // table IssueEvent - should contain error details sent
    // -------------------
    const issue = issuesAfter[0]
    const issueEvent = await knex('IssueEvent as ie')
      .innerJoin('Issue as i', 'ie.issueId', 'i.id')
      .where('ie.issueId', issue.id)
      .first()
    const eventData = JSON.parse(issueEvent.data)
    const { details: eventDetailsStored } = eventData
    expect(eventDetailsStored).to.containSubset(detailsSent)
    assert.equal(issueEvent.deviceId, deviceId)

    // -------------------
    // table DeviceOperation
    // -------------------
    const totals2 = await getTotalsOfDeviceOperation()
    assert.equal(totals1 + logDatas.length, totals2)

    // get stored deviceOperation entry and compare with sent data
    const deviceOperation = await knex('DeviceOperation')
      .orderBy('id', 'desc')
      .first()
    assert.equal(deviceOperation.deviceId, deviceId)
    assert.equal(
      format(deviceOperation.startedOn, 'yyyy-MM-dd HH:mm:ss'),
      format(logDatas[2].occurredOn, 'yyyy-MM-dd HH:mm:ss')
    )
    const { details: detailsStored } = JSON.parse(deviceOperation.data)
    expect(detailsStored).to.containSubset(detailsSent)
  })
})
