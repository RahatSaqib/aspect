const _ = require('lodash')
const chai = require('chai')
const { addHours, subDays } = require('date-fns')

const { createGxConnectTestContext } = require('./gxconnect_utils')
const { postToDeviceApi } = require('../utils')
const { knex } = require('../../../src/db')
const { basicResultPayload } = require('./geneXpertConstants')
const { waitForIdle, waitForAction } = require('../../utils/mqUtils')
const { deviceInstrumentReplaced } = require('../../../src/device/actions')

const server = require('../../utils/testUtils')

const { assert, expect } = chai

describe('Backward update db after getting tests from offline device', () => {
  const macAddress = 'MAC00000000FAKE'
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const countryCode = 'US'
  const deviceName = 'New GeneXpert Laboratory'

  const context = createGxConnectTestContext(server, {
    countryCode,
    adminUsername,
    adminPassword,
    deviceName,
    macAddress,
  })

  beforeEach(context.beforeRegisterAndSetDevice)
  afterEach(context.afterCleanUp)

  it('should trigger issue InstrumentReplaced', async () => {
    const now = new Date()
    // const messageContext = await createMessageContext()
    const startedOn1 = subDays(now, 3)
    const startedOn2 = subDays(now, 2)

    const instrumentSerial1 = '123456'
    const instrumentSerial2 = `${instrumentSerial1}-2`
    const moduleName = 'A1'

    /**
     * 1. create new device with result
     */
    const { basicDevicePayload } = context
    const { deviceAuth } = context
    const devicePayload = _.merge({}, basicDevicePayload, { name: deviceName })
    let response = await postToDeviceApi({
      authHeader: deviceAuth,
      payload: _.merge({}, devicePayload, basicResultPayload, {
        result: {
          id: `${basicResultPayload.result.id}-1`,
          startedOn: startedOn1,
          endedOn: addHours(startedOn1, 2),
          sample: {
            id: `${basicResultPayload.result.sample.id}-1`,
          },
          patient: {
            id: `${basicResultPayload.result.patient.id}-1`,
          },
          instrument: {
            serial: instrumentSerial1,
            module: {
              name: moduleName,
              serial: '123',
            },
          },
        },
      }),
    })
    assert.equal(response.statusCode, 200)

    const { id: deviceId, siteId, geographyId, partnerId } = response.body.device

    // wait a bit until all MQ jobs are finished after creating a new device
    await waitForIdle()

    const waitForInstrumentReplaced = waitForAction(deviceInstrumentReplaced(deviceId))

    /**
     * 2. post new test with same module props but another instrumentSerial
     */
    response = await postToDeviceApi({
      authHeader: deviceAuth,
      payload: _.merge({}, devicePayload, basicResultPayload, {
        result: {
          id: `${basicResultPayload.result.id}-2`,
          startedOn: startedOn2,
          endedOn: addHours(startedOn2, 2),
          sample: {
            id: `${basicResultPayload.result.sample.id}-2`,
          },
          patient: {
            id: `${basicResultPayload.result.patient.id}-2`,
          },
          instrument: {
            serial: instrumentSerial2, // new instrument serial
            module: {
              name: moduleName,
              serial: '456',
            },
          },
        },
      }),
    })
    assert.equal(response.statusCode, 200)

    /**
     * 3. wait for InstrumentReplaced issue dispatched into MQ
     */
    await waitForInstrumentReplaced

    // wait a bit to let issue 'InstrumentReplaced' handler to insert entry into `Issue` table
    await waitForIdle(2000)

    // get JSON of issue created
    const issues = await knex('Issue as i')
      .innerJoin('IssueType as it', 'it.id', 'i.issueTypeId')
      .where('it.externalId', 'InstrumentReplaced')
      .where('i.deviceId', deviceId)
      .select('i.*')
    assert.equal(issues.length, 1)
    const [issue] = issues
    assert.equal(issue.siteId, siteId)
    assert.equal(issue.geographyId, geographyId)
    assert.equal(issue.partnerId, partnerId)

    const issueData = JSON.parse(issue.data)
    expect(issueData).to.containSubset({
      moduleName,
      newInstrumentSerial: instrumentSerial2,
      replacedInstrumentSerial: instrumentSerial1,
    })
  })
})
