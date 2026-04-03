const chai = require('chai')
const Promise = require('bluebird')
const { format, subDays, addDays, addMinutes } = require('date-fns')
const { createTestContext } = require('./utils')
const { knex } = require('../../src/db')

const { deviceMaintenanceTypeToId } = require('../../src/shared/dictionary')
const { deviceHardwareError } = require('../../src/device/actions')
const { waitForIdle, waitForAction } = require('../utils/mqUtils')
const server = require('../utils/testUtils')

const { assert, expect } = chai

const baseConfig = {
  requirePrinter: 'yes',
  adminPassword: 'pwd123',
  firmwareUpdateRequired: 'no',
}

const context = createTestContext(knex, server, {
  user: 'admin',
  type: 'DaktariVirology',
  partner: 'Partner One',
  instrumentSerial: 'GX-00001',
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
const logDatasWithCalibration = [
  logDataWithCalibration,
  {
    externalId: 139,
    occurredOn: new Date('2018-11-24 14:13:56'),
    logFileName: 'C:\\GeneXpert\\log\\XpertCal-2015.11.03_15.27.28.028-0.log',
    logLevel: 'INFO',
    details:
      '{"RawText":"<XpertCalServiceProvider>Activation valid days: 45","Errors":[],"Calibrations":[{"Source":"XpertCalServiceProvider","Site":"","Message":"Activation valid days: 45"}]}',
  },
]
const logDataWithErrors = {
  externalId: 139, // some unique Id in Logs table in SQLite db on device side
  occurredOn: new Date('2018-12-02 09:56:56'),
  logFileName: 'C:\\GeneXpert\\log\\XpertCal-2017.10.27_18.02.57.007-1.log',
  logLevel: 'INFO',
  details: JSON.stringify({
    Errors: [
      {
        Message:
          'Cepheid System ID 900001:\r\nHeater A Temperature Unstable.\r\nContact your Authorized Service Provider',
        ErrorCode: '4009',
        SiteSerialNumber: 'MYSERIAL',
      },
    ],
    RawText:
      '<BurnCDError>Error Code 4009, Cepheid System ID 900001:\r\nHeater A Temperature Unstable.\r\nContact your Authorized Service Provider',
    Calibrations: [],
  }),
}

const logDataWithErrorsThatShouldBeDeduplicatedInTimespan = {
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
        SiteSerialNumber: 'MYSERIAL',
      },
    ],
    RawText:
      '<BurnCDError>Error Code 1002, Cepheid System ID 900001:\r\nHeater Temperature Differential Error.\r\nContact your Authorized Service Provider',
    Calibrations: [],
  }),
}

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

describe('Process GeneXpert Logs', () => {
  beforeEach(async () => {
    await context.createDeviceWithResult({ instrumentSerial: 'GX-00001' })
  })
  afterEach(context.afterEach)
  it('should create entry with log details in table DeviceOperation', async () => {
    const { apiKey, deviceAuth } = context
    assert.isOk(apiKey)
    // initial count of deviceOperation entries
    const totals1 = await getTotalsOfDeviceOperation()

    const logData = logDataWithCalibration
    const res = await postLog(deviceAuth, logSource, [logData])
    assert.equal(res.status, 200)

    const totals2 = await getTotalsOfDeviceOperation()
    assert.equal(totals1 + 1, totals2)

    // get stored deviceOperation entry and compare with sent data
    const deviceOperation = await knex('DeviceOperation').orderBy('CreatedOn', 'desc').first()
    const { id: deviceApiKeyId } = await knex('DeviceApiKey').where({ token: apiKey.token }).first('id')
    assert.equal(deviceOperation.deviceApiKeyId, deviceApiKeyId)
    assert.equal(
      format(deviceOperation.occurredOn, 'yyyy-MM-dd HH:mm:ss'),
      format(logData.occurredOn, 'yyyy-MM-dd HH:mm:ss')
    )
    const { details: detailsStored } = JSON.parse(deviceOperation.data)
    const detailsSent = JSON.parse(logData.details)
    expect(detailsStored).to.containSubset(detailsSent)
  })

  it('should create 2 entries in table DeviceOperation for log array', async () => {
    const { apiKey, deviceAuth } = context
    assert.isOk(apiKey)
    // initial count of deviceOperation entries
    const totals1 = await getTotalsOfDeviceOperation()

    const logData = logDatasWithCalibration
    const res = await postLog(deviceAuth, logSource, logData)
    assert.equal(res.status, 200)

    const totals2 = await getTotalsOfDeviceOperation()
    assert.equal(totals1 + 2, totals2)

    // get stored deviceOperation entry and compare with sent data
    const deviceOperation = await knex('DeviceOperation').orderBy('CreatedOn', 'desc').first()
    const { id: deviceApiKeyId } = await knex('DeviceApiKey').where({ token: apiKey.token }).first('id')
    assert.equal(deviceOperation.deviceApiKeyId, deviceApiKeyId)
    assert.equal(
      format(deviceOperation.occurredOn, 'yyyy-MM-dd HH:mm:ss'),
      format(logData[0].occurredOn, 'yyyy-MM-dd HH:mm:ss')
    )
    const { details: detailsStored } = JSON.parse(deviceOperation.data)
    const detailsSent = JSON.parse(logData[0].details)
    expect(detailsStored).to.containSubset(detailsSent)
  })

  it('should return 400 if some required props missed for log data', async () => {
    const { apiKey, deviceAuth } = context
    assert.isOk(apiKey)

    let res = await postLog(deviceAuth, logSource, [
      {
        ...logDataWithCalibration,
        occurredOn: null,
      },
    ])
    assert.equal(res.status, 400)

    res = await postLog(deviceAuth, logSource, [
      {
        ...logDataWithCalibration,
        logFileName: null,
      },
    ])
    assert.equal(res.status, 400)

    res = await postLog(deviceAuth, logSource, [
      {
        ...logDataWithCalibration,
        logLevel: null,
      },
    ])
    assert.equal(res.status, 400)

    res = await postLog(deviceAuth, logSource, [
      {
        ...logDataWithCalibration,
        details: null,
      },
    ])
    assert.equal(res.status, 400)
  })

  it('should skip processing log if wrong source specified', async () => {
    const { apiKey, deviceAuth } = context
    assert.isOk(apiKey)
    // initial count of deviceOperation entries
    const totals1 = await getTotalsOfDeviceOperation()

    const logData = [logDataWithCalibration]
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
    const getDateDaysAgo = daysAgo => new Date(format(subDays(new Date(), daysAgo), 'yyyy-MM-dd HH:mm:ss'))

    const logDatas = [
      {
        ...logDataWithErrors,
        externalId: 138,
        occurredOn: getDateDaysAgo(50),
      },
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
    const detailsSent = JSON.parse(logDatas[3].details)

    // get device to pass it to action creator deviceHardwareError
    const device = await knex('Device').where('id', deviceId).first()

    // helper func to get all Issue entries for this deviceId and issueType
    const getIssues = deviceId =>
      knex('Issue as i')
        .innerJoin('IssueType as it', 'i.issueTypeId', 'it.id')
        .where('it.externalId', 'HardwareTemperatureErrors')
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
    const hardwareErorCode = '1002'

    /**
     * post data with error code 1002 within daysPeriod
     *
     * See trigger conditions in api/seeds/fixtures/IssueEventTrigger.json, i.e.
     *  "daysPeriod": 60,
     *  "minErrors": 4
     */
    // helper - define action to wait for, post data, asert response, waitFor*
    const postError = async (data, shouldTrigger = false) => {
      const options = {
        startedOn: new Date(format(data.occurredOn, 'yyyy-MM-dd HH:mm:ss')),
        details: JSON.parse(data.details),
      }
      // see calling deviceHardwareError() in api/src/plugin/utils.js in func shouldTriggerHardwareErrorAnalysis()
      const action = deviceHardwareError(device, hardwareErorCode, options)
      const waitForHardwareError = waitForAction(action)
      const res = await postLog(deviceAuth, logSource, [data])
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
    assert.equal(issuesBefore.length, issuesAfter.length)
    // post 4-rd error
    await postError(logDatas[3])
    issuesAfter = await getIssues(deviceId)

    // 4rd error triggers issue - Issue table contains just created record with issue details
    assert.equal(issuesBefore.length + 1, issuesAfter.length)

    // -------------------
    // table IssueEvent - should contain error details sent
    // -------------------
    const issue = issuesAfter[0]
    const issueEvent = await knex('IssueEvent as ie')
      .innerJoin('Issue as i', 'ie.issueId', 'i.id')
      .where('ie.issueId', issue.id)
      .first()

    // -------------------
    // Email message should contain the instrument serial number as the System serial
    // -------------------
    const { emailMessage } = await knex('Notification as n')
      .innerJoin('EmailMessage as em', 'n.emailMessageId', 'em.id')
      .where('issueId', issue.id)
      .first('em.body as emailMessage')
    assert.isNotNull(emailMessage)
    assert.isTrue(emailMessage.indexOf('System Serial: GX-00001') > -1)

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
    const deviceOperation = await knex('DeviceOperation').orderBy('id', 'desc').first()
    const { id: deviceApiKeyId } = await knex('DeviceApiKey').where({ token: apiKey.token }).first('id')
    assert.equal(deviceOperation.deviceApiKeyId, deviceApiKeyId)
    assert.equal(
      format(deviceOperation.occurredOn, 'yyyy-MM-dd HH:mm:ss'),
      format(logDatas[3].occurredOn, 'yyyy-MM-dd HH:mm:ss')
    )
    const { details: detailsStored } = JSON.parse(deviceOperation.data)
    expect(detailsStored).to.containSubset(detailsSent)
  })

  it('should create entry with Errors in log details and trigger "deviceHardwareError" action if the error code is in the list of error codes that should be deduplicated based on timeframe and the errors are MORE than an hour apart', async () => {
    const { apiKey, deviceAuth, deviceId } = context
    assert.isOk(apiKey)
    // initial count of deviceOperation entries
    const totals1 = await getTotalsOfDeviceOperation()
    // helper for getting date N days ago
    const getDateDaysAgo = daysAgo => new Date(format(subDays(new Date(), daysAgo), 'yyyy-MM-dd HH:mm:ss'))

    const logDatas = [
      {
        ...logDataWithErrorsThatShouldBeDeduplicatedInTimespan,
        externalId: 138,
        occurredOn: getDateDaysAgo(50),
      },
      {
        ...logDataWithErrorsThatShouldBeDeduplicatedInTimespan,
        externalId: 139,
        occurredOn: getDateDaysAgo(10),
      },
      {
        ...logDataWithErrorsThatShouldBeDeduplicatedInTimespan,
        externalId: 140,
        occurredOn: getDateDaysAgo(5),
      },
      {
        ...logDataWithErrorsThatShouldBeDeduplicatedInTimespan,
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
        .where('it.externalId', 'HardwareTemperatureErrors')
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
    const hardwareErorCode = '1002'

    /**
     * post data with error code 1002 within daysPeriod
     *
     * See trigger conditions in api/seeds/fixtures/IssueEventTrigger.json, i.e.
     *  "daysPeriod": 30,
     *  "minErrors": 3
     */
    // helper - define action to wait for, post data, asert response, waitFor*
    const postError = async (data, shouldTrigger = false) => {
      const options = {
        startedOn: new Date(format(data.occurredOn, 'yyyy-MM-dd HH:mm:ss')),
        details: JSON.parse(data.details),
      }
      // see calling deviceHardwareError() in api/src/plugin/utils.js in func shouldTriggerHardwareErrorAnalysis()
      const action = deviceHardwareError(device, hardwareErorCode, options)
      const waitForHardwareError = waitForAction(action)

      const res = await postLog(deviceAuth, logSource, [data])
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

    // post 4-rd error
    await postError(logDatas[3])
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
    const deviceOperation = await knex('DeviceOperation').orderBy('id', 'desc').first()
    const { id: deviceApiKeyId } = await knex('DeviceApiKey').where({ token: apiKey.token }).first('id')
    assert.equal(deviceOperation.deviceApiKeyId, deviceApiKeyId)
    assert.equal(
      format(deviceOperation.occurredOn, 'yyyy-MM-dd HH:mm:ss'),
      format(logDatas[3].occurredOn, 'yyyy-MM-dd HH:mm:ss')
    )
    const { details: detailsStored } = JSON.parse(deviceOperation.data)
    expect(detailsStored).to.containSubset(detailsSent)
  })

  it('should NOT create entry with Errors in log details and trigger "deviceHardwareError" action if there is a suppresion condition', async () => {
    const { apiKey, deviceAuth, deviceId } = context
    assert.isOk(apiKey)

    // helper for getting date N days ago
    const getDateDaysAgo = daysAgo => new Date(format(subDays(new Date(), daysAgo), 'yyyy-MM-dd HH:mm:ss'))

    const logDatas = [
      {
        ...logDataWithErrorsThatShouldBeDeduplicatedInTimespan,
        externalId: 138,
        occurredOn: getDateDaysAgo(50),
      },
      {
        ...logDataWithErrorsThatShouldBeDeduplicatedInTimespan,
        externalId: 139,
        occurredOn: getDateDaysAgo(10),
      },
      {
        ...logDataWithErrorsThatShouldBeDeduplicatedInTimespan,
        externalId: 140,
        occurredOn: getDateDaysAgo(5),
      },
      {
        ...logDataWithErrorsThatShouldBeDeduplicatedInTimespan,
        externalId: 141,
        occurredOn: getDateDaysAgo(2),
      },
    ]

    // get device to pass it to action creator deviceHardwareError
    const device = await knex('Device').where('id', deviceId).first()

    // helper func to get all Issue entries for this deviceId and issueType
    const getIssues = deviceId =>
      knex('Issue as i')
        .innerJoin('IssueType as it', 'i.issueTypeId', 'it.id')
        // .where('it.externalId', 'HardwareHeaterTemperatureDifferentialError')
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
    const hardwareErorCode = '1002'

    /**
     * post data with error code 1002 within daysPeriod
     *
     * See trigger conditions in api/seeds/fixtures/IssueEventTrigger.json, i.e.
     *  "daysPeriod": 30,
     *  "minErrors": 3
     */
    // helper - define action to wait for, post data, asert response, waitFor*
    const postError = async (data, shouldTrigger = false) => {
      const options = {
        startedOn: new Date(format(data.occurredOn, 'yyyy-MM-dd HH:mm:ss')),
        details: JSON.parse(data.details),
      }
      // see calling deviceHardwareError() in api/src/plugin/utils.js in func shouldTriggerHardwareErrorAnalysis()
      const action = deviceHardwareError(device, hardwareErorCode, options)
      const waitForHardwareError = waitForAction(action)

      const res = await postLog(deviceAuth, logSource, [data])
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
    assert.equal(issuesBefore.length, issuesAfter.length)

    await postError(logDatas[3])
    issuesAfter = await getIssues(deviceId)
    // 3rd error triggers issue - Issue table contains just created record with issue details
    assert.equal(issuesBefore.length + 1, issuesAfter.length)
    /// send another error code that the one before suppresed
    // post 1-st error
    await Promise.each(logDatas, async logEntry => {
      logEntry.details = JSON.parse(logEntry.details)
      logEntry.details.Errors[0].ErrorCode = 4017
      logEntry.details = JSON.stringify(logEntry.details)
      await postError(logEntry)
    })

    issuesAfter = await getIssues(deviceId)
    // 3rd error triggers issue - Issue table contains just created record with issue details
    assert.equal(issuesBefore.length + 1, issuesAfter.length)
  })

  it('should NOT create entry with Errors in log details and trigger "deviceHardwareError" action if the error code is in the list of error codes that should be deduplicated based on timeframe and the errors are LESS than an hour apart', async () => {
    const { apiKey, deviceAuth, deviceId } = context
    assert.isOk(apiKey)
    // helper for getting date N days ago
    const getDateDaysAgo = daysAgo => new Date(format(subDays(new Date(), daysAgo), 'yyyy-MM-dd HH:mm:ss'))

    const logDatas = [
      {
        ...logDataWithErrorsThatShouldBeDeduplicatedInTimespan,
        externalId: 139,
        occurredOn: getDateDaysAgo(0),
      },
      {
        ...logDataWithErrorsThatShouldBeDeduplicatedInTimespan,
        externalId: 140,
        occurredOn: getDateDaysAgo(0),
      },
      {
        ...logDataWithErrorsThatShouldBeDeduplicatedInTimespan,
        externalId: 141,
        occurredOn: getDateDaysAgo(0),
      },
    ]

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
    const hardwareErorCode = '1002'

    /**
     * post data with error code 1002 within daysPeriod
     *
     * See trigger conditions in api/seeds/fixtures/IssueEventTrigger.json, i.e.
     *  "daysPeriod": 30,
     *  "minErrors": 3
     */
    // helper - define action to wait for, post data, asert response, waitFor*
    const postError = async (data, shouldTrigger = false) => {
      const options = {
        startedOn: new Date(format(data.occurredOn, 'yyyy-MM-dd HH:mm:ss')),
        details: JSON.parse(data.details),
      }
      // see calling deviceHardwareError() in api/src/plugin/utils.js in func shouldTriggerHardwareErrorAnalysis()
      const action = deviceHardwareError(device, hardwareErorCode, options)
      const waitForHardwareError = waitForAction(action)

      const res = await postLog(deviceAuth, logSource, [data])
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
    assert.equal(issuesBefore.length, issuesAfter.length)
  })
})

describe('Process Calibration data in GeneXpert Logs', () => {
  let deviceMaintenanceTypeId
  let deviceMaintenance
  let deviceAuth
  let deviceId

  before(async () => {
    deviceMaintenanceTypeId = await deviceMaintenanceTypeToId('calibration')
  })

  beforeEach(async () => {
    await context.createDeviceWithResult({ instrumentSerial: 'GX-00001' })

    const { apiKey } = context
    ;[{ deviceAuth, deviceId }] = [context]
    assert.isOk(apiKey)

    /**
     * check that device doesn't have a calibration defined
     */
    deviceMaintenance = await knex('DeviceMaintenance').where(getDeviceMaintenanceProps(deviceId)).first()
    assert.isUndefined(deviceMaintenance)
  })
  afterEach(context.afterEach)

  const getDeviceMaintenanceProps = deviceId => ({
    deviceId,
    deviceMaintenanceTypeId,
    current: 1,
  })

  it('should NOT create entry in DeviceMaintenance if posted log has missing Calibrations', async () => {
    /**
     * post data with empty Calibrations array - no entry should create
     * in DeviceMaintenance
     */
    const logData = logDataWithErrors
    const res = await postLog(deviceAuth, logSource, [logData])
    assert.equal(res.status, 200)
    // check that device now has calibration defined
    deviceMaintenance = await knex('DeviceMaintenance').where(getDeviceMaintenanceProps(deviceId)).first()
    assert.isUndefined(deviceMaintenance)
  })

  it('should create entry in DeviceMaintenance because posted log has Calibrations', async () => {
    /**
     * post `logData` with `Calibrations` array defined.
     * Because no item for this device/date exists in DeviceMaintenance -
     * should add new item in DeviceMaintenance table
     */
    const logData = [logDataWithCalibration]
    const res = await postLog(deviceAuth, logSource, logData)
    assert.equal(res.status, 200)
    // check that device now has calibration defined
    deviceMaintenance = await knex('DeviceMaintenance').where(getDeviceMaintenanceProps(deviceId)).first()
    assert.isDefined(deviceMaintenance)
  })

  it('should NOT create new entry in DeviceMaintenance if posted log has calibration for past date', async () => {
    let res

    /**
     * post `logData` with `Calibrations` array defined.
     * Because no item for this device/date exists in DeviceMaintenance -
     * should add new item in DeviceMaintenance table
     */
    res = await postLog(deviceAuth, logSource, [logDataWithCalibration])
    assert.equal(res.status, 200)
    // check that device now has calibration defined
    deviceMaintenance = await knex('DeviceMaintenance').where(getDeviceMaintenanceProps(deviceId)).first()
    assert.isDefined(deviceMaintenance)

    /**
     * post log data with past date
     */
    const logData = {
      ...logDataWithCalibration,
      occurredOn: subDays(logDataWithCalibration.occurredOn, 5),
    }

    res = await postLog(deviceAuth, logSource, [logData])
    assert.equal(res.status, 200)
    //
    deviceMaintenance = await knex('DeviceMaintenance').where(getDeviceMaintenanceProps(deviceId)).first()
    // current calibration date is NOT equal to what we've just posted
    assert.isTrue(deviceMaintenance.contextDate > logData.occurredOn)
    assert.equal(
      deviceMaintenance.contextDate.toDateString(),
      // previous value we've posted before
      logDataWithCalibration.occurredOn.toDateString()
    )
  })

  it('should create NEW entry in DeviceMaintenance for log with future date', async () => {
    let logData
    let res

    /**
     * post `logData` with `Calibrations` array defined.
     * Because no item for this device/date exists in DeviceMaintenance -
     * should add new item in DeviceMaintenance table
     */
    logData = logDataWithCalibration
    res = await postLog(deviceAuth, logSource, [logData])
    assert.equal(res.status, 200)
    // check that device now has calibration defined
    deviceMaintenance = await knex('DeviceMaintenance').where(getDeviceMaintenanceProps(deviceId)).first()
    assert.isDefined(deviceMaintenance)

    /**
     * post log data with future date
     */
    logData = {
      ...logDataWithCalibration,
      occurredOn: addDays(logDataWithCalibration.occurredOn, 5),
    }
    logData.externalId = 170
    res = await postLog(deviceAuth, logSource, [logData])
    assert.equal(res.status, 200)
    //
    deviceMaintenance = await knex('DeviceMaintenance').where(getDeviceMaintenanceProps(deviceId)).first()
    // current calibration date is equal to what we've just posted
    assert.isTrue(deviceMaintenance.contextDate.getTime() === logData.occurredOn.getTime())
  })

  it('should NOT create entry in DeviceMaintenance for log in the same date', async () => {
    let logData
    let res

    /**
     * post `logData` with `Calibrations` array defined.
     * Because no item for this device/date exists in DeviceMaintenance -
     * should add new item in DeviceMaintenance table
     */
    logData = logDataWithCalibration
    res = await postLog(deviceAuth, logSource, [logData])
    assert.equal(res.status, 200)
    // check that device now has calibration defined
    deviceMaintenance = await knex('DeviceMaintenance').where(getDeviceMaintenanceProps(deviceId)).first()
    assert.isDefined(deviceMaintenance)

    /**
     * post log data with same day but a bit newer date
     */
    logData = {
      ...logData,
      occurredOn: addMinutes(logData.occurredOn, 2),
    }
    res = await postLog(deviceAuth, logSource, [logData])
    assert.equal(res.status, 200)
    const deviceMaintenanceNew = await knex('DeviceMaintenance').where(getDeviceMaintenanceProps(deviceId)).first()
    // see that API didn't duplicated entry per same device in same day
    assert.isTrue(deviceMaintenance.id === deviceMaintenanceNew.id)
  })
})
