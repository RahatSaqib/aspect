const _ = require('lodash')
const chai = require('chai')
const { addDays, addHours, format, subDays, parseISO } = require('date-fns')
const Promise = require('bluebird')

const { allDeviceMaintenanceStatusToId } = require('../../../src/shared/dictionary')
const { createGxConnectTestContext } = require('./gxconnect_utils')
const { postToDeviceApi } = require('../utils')
const { knex } = require('../../../src/db')
const { basicResultPayload } = require('./geneXpertConstants')
const { createMessageContext, waitForIdle, waitForAction, dispatchAndWaitForAction } = require('../../utils/mqUtils')
const { deviceOffline, logDeviceMaintenanceStatus } = require('../../../src/device/actions')
const { factGenerateDeviceConnectivity } = require('../../../src/fact/actions')

const server = require('../../utils/testUtils')

const { assert, expect } = chai

describe('Backward update db after getting tests from offline device', () => {
  const macAddress = 'MAC00000000FAKE'
  const adminUsername = 'admin'
  const adminPassword = 'test07'
  const countryCode = 'US'
  const deviceName = 'New GeneXpert Laboratory'

  // helper func
  const getLatestLogs = async (deviceId, minDate) =>
    knex('DeviceMaintenanceStatusLog as dmsl')
      .leftOuterJoin('DeviceMaintenanceStatusLog as dmsl2', function () {
        this.on('dmsl2.deviceId', 'dmsl.deviceId')
          .andOn('dmsl2.day', 'dmsl.day')
          .andOn(function () {
            this.on('dmsl2.createdOn', '>', 'dmsl.createdOn')
            this.orOn(function () {
              this.on('dmsl2.createdOn', '=', 'dmsl.createdOn').andOn('dmsl2.id', '>', 'dmsl.id')
            })
          })
      })
      .where('dmsl.deviceId', deviceId)
      .where('dmsl.day', '>=', knex.raw('Date(?)', [minDate]))
      .whereNull('dmsl2.id')
      .select('dmsl.*')

  const context = createGxConnectTestContext(server, {
    countryCode,
    adminUsername,
    adminPassword,
    deviceName,
    macAddress,
  })

  beforeEach(context.beforeRegisterAndSetDevice)
  afterEach(context.afterCleanUp)

  it('should set device Offline, then upload results and check log for all previous days when tests were performed', async () => {
    const now = new Date()
    const messageContext = await createMessageContext()

    /**
     * 1. create new device (without result)
     */
    const { basicDevicePayload } = context
    const { deviceAuth } = context
    const devicePayload = _.merge({}, basicDevicePayload, { name: deviceName })
    // Post to deviceApi to create new device
    const response = await postToDeviceApi({
      authHeader: deviceAuth,
      payload: devicePayload,
    })
    assert.equal(response.statusCode, 200)
    const { id: deviceId, partnerId } = response.body.device
    // wait a bit until all MQ jobs are finished after creating a new device
    await waitForIdle()

    /**
     * 2.1. see that flag 'offline' in table FactDeviceFlag is not set
     * meaning that just created device is treated as being 'online'
     */
    let factDevice
    ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId }).select()
    expect(factDevice).to.containSubset({
      offline: 0, // device is 'online'
      noResults: 0,
      maintenance: 0,
    })

    /**
     * 2.2. set device 'Offline'
     */
    // get Partner-specific props for being 'offline' and 'no-result'
    const partnerProps = await knex('Partner').where({ id: partnerId }).first()
    const { maxDaysDeviceOffline, maxDaysDeviceNoResults } = partnerProps
    expect(maxDaysDeviceOffline).to.be.above(1)
    expect(maxDaysDeviceNoResults).to.be.above(maxDaysDeviceOffline)
    const deviceOfflineDate = subDays(now, maxDaysDeviceOffline + 1)
    const deviceNoResultsDate = subDays(now, maxDaysDeviceNoResults + 1)
    // set device that it has been pinged or received results corresponding # days ago
    await knex('Device as d').where('d.id', deviceId).update({
      createdOn: deviceNoResultsDate,
      lastPingOn: deviceOfflineDate,
      lastSeenOn: deviceOfflineDate,
    })
    const waitForOffline = waitForAction(deviceOffline(deviceId))
    /**
     * run MQ action `factGenerateDeviceConnectivity` to update
     * fields 'lastPingOn' and 'createdOn' in table FactDeviceFlag
     * for current device.
     * Notice that handler runs another MQ actions, see below.
     */
    await messageContext.dispatch(factGenerateDeviceConnectivity(deviceId))
    /**
     * above MQ action (factGenerateDeviceConnectivity) triggers another
     * chained action `deviceOffline` with same parameter `deviceId`.
     * So here we await for this new MQ action
     */
    await waitForOffline
    await waitForIdle()
    // let factDevice
    ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId }).select()
    expect(factDevice).to.containSubset({
      offline: 1, // device is 'offline'
      noResults: 0,
      maintenance: 0,
    })
    assert.isNotOk(factDevice.maintenanceDueOn)

    /**
     * 3. prepare dates for table 'DeviceMaintenanceStatusLog'
     */
    const deviceMaintenanceStatusToId = await allDeviceMaintenanceStatusToId()
    const minDate = deviceOfflineDate
    const maxDate = now
    const days = []
    for (let day = minDate; day < maxDate; day = addDays(day, 1)) {
      days.push(`${format(day, 'yyyy-MM-dd')}T00:00:00.000Z`)
    }
    /**
     * 4.1. set Offline status in DeviceMaintenanceStatusLog for all related days for this deviceId.
     * Notice that we dispatch in MQ same action 'logDeviceMaintenanceStatus' as in `api/src/scheduler.js`,
     * but pass there a day which is treated as 'today' to process past date.
     */
    await Promise.each(days, day => dispatchAndWaitForAction(logDeviceMaintenanceStatus(day)))
    await waitForIdle()
    /**
     * 4.2. check that all processed days should be set to `inactiveUnknown` because
     * func onDeviceMaintenanceStatusLogScheduled (see in api/src/device/service.js)
     * uses status 'inactiveUnknown' for days without results (and when current
     * device doesn't have deviceMaintenanceStatusLogId field defined)
     */
    let logs = await getLatestLogs(deviceId, minDate)
    logs.forEach(log => {
      expect(log.deviceMaintenanceStatusId).to.be.equal(deviceMaintenanceStatusToId.inactiveUnknown)
    })

    /**
     * 4.3. Let's manually change statuses for 1st, and 2nd days from 'inactiveUnknown'
     * to 'inactiveOutOfInventory' and 'inactiveDownForRepair'
     */
    const customStatuses = [
      deviceMaintenanceStatusToId.inactiveOutOfInventory,
      deviceMaintenanceStatusToId.inactiveDownForRepair,
    ]
    await Promise.each(customStatuses, async (deviceMaintenanceStatusId, index) =>
      knex('DeviceMaintenanceStatusLog').update({ deviceMaintenanceStatusId }).where('id', logs[index].id)
    )
    // reread logs and see that first 3 days have manually changed to another statuses
    logs = await getLatestLogs(deviceId, minDate)
    logs.forEach((log, index) => {
      expect(log.deviceMaintenanceStatusId).to.be.equal(
        index < customStatuses.length ? customStatuses[index] : deviceMaintenanceStatusToId.inactiveUnknown
      )
    })

    /**
     * 5. Insert results for days which have been marked as inactiveUnknown
     */
    await Promise.each(days, async (day, index) => {
      const date = parseISO(day)
      // post tests to Offline device for each day when DeviceMaintenanceStatusLog was set to 'inactiveUnknown'
      const response = await postToDeviceApi({
        authHeader: deviceAuth,
        payload: _.merge({}, devicePayload, basicResultPayload, {
          result: {
            id: `${basicResultPayload.result.id}-${index}`,
            startedOn: addHours(date, 5),
            endedOn: addHours(date, 7),
            sample: {
              id: `${basicResultPayload.result.sample.id}-${index}`,
            },
            patient: {
              id: `${basicResultPayload.result.patient.id}-${index}`,
            },
            instrument: {
              serial: '123456',
              module: {
                serial: '234',
                name: 'A1',
              },
            },
          },
        }),
      })
      assert.equal(response.statusCode, 200)
    })

    // wait a bit until all MQ jobs are finished for each inserted result
    await waitForIdle()

    /**
     * 6. check that 'offline' flag in FactDeviceFlag was reset
     */
    ;[factDevice] = await knex('FactDeviceFlag').where({ deviceId }).select()
    expect(factDevice).to.containSubset({
      offline: 0, // now device is 'online'
      noResults: 0,
      maintenance: 0,
    })
    assert.isNotOk(factDevice.maintenanceDueOn)

    /**
     * 7. days with tests are marked now as Active in DeviceMaintenanceStatusLog -
     * including all manually changed custom statuses (see step 4.3 above)
     */
    logs = await getLatestLogs(deviceId, minDate)
    logs.forEach(log => {
      expect(log.deviceMaintenanceStatusId).to.be.equal(deviceMaintenanceStatusToId.active)
    })
  })
})
