const chai = require('chai')
const { format } = require('date-fns')
const { createTestContext } = require('./utils')
const { knex } = require('../../src/db')

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
const logData = {
  externalId: 138, // some unique Id in Logs table in SQLite db on device side
  occurredOn: new Date('2018-11-23 14:13:56'),
  logFileName: 'C:\\GeneXpert\\log\\XpertCal-2015.11.03_15.27.28.028-0.log',
  logLevel: 'INFO',
  details:
    '{"RawText":"<XpertCalServiceProvider>Activation valid days: 45","Errors":[],"Calibrations":[{"Source":"XpertCalServiceProvider","Site":"","Message":"Activation valid days: 45"}]}',
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

    res = await postLog(deviceAuth, logSource, {
      ...logData,
      logLevel: null,
    })
    assert.equal(res.status, 400)

    res = await postLog(deviceAuth, logSource, {
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

    const res = await postLog(deviceAuth, 'Invalid Source', logData)
    assert.equal(res.status, 200)

    // total number of entries didn't change
    const totals2 = await getTotalsOfDeviceOperation()
    assert.equal(totals1, totals2)
  })
})
