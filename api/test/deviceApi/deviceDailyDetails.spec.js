const chai = require('chai')
const addDays = require('date-fns/addDays')
const subDays = require('date-fns/subDays')

const { createTestContext, postToDeviceApi } = require('./utils')
const server = require('../utils/testUtils')
const { knex } = require('../../src/db')
const { startOfDayUtc } = require('../../src/shared/date')
const { deviceMaintenanceTypeToId } = require('../../src/shared/dictionary')
const { getPeopleBase } = require('../../src/shared/utilsPerson')

const { assert } = chai

const baseConfig = {
  requirePrinter: 'yes',
  adminPassword: 'pwd123',
  firmwareUpdateRequired: 'no',
}

const context = createTestContext(knex, server, {
  user: 'admin',
  type: 'DaktariVirology',
  partner: 'Partner One',
  baseConfig,
})

describe('Device daily details', () => {
  beforeEach(async () => {
    await context.createDeviceWithApiKey()
  })
  afterEach(context.afterEach)

  describe('when lastCalibrated is included in the configuration data payload', () => {
    const now = new Date()

    // ------------------
    // local helpers
    // ------------------
    const getDeviceMaintenanceStatusLogId = async deviceId => {
      const { deviceMaintenanceStatusLogId } = await knex('Device')
        .where('id', deviceId)
        .first('deviceMaintenanceStatusLogId')
      return deviceMaintenanceStatusLogId
    }
    const getDeviceMaintenance = async whereClause => {
      const deviceMaintenance = await knex('DeviceMaintenance').where(whereClause).first()
      return deviceMaintenance
    }

    it('should process it and may set calibration date for device', async () => {
      const deviceMaintenanceTypeId = await deviceMaintenanceTypeToId('calibration')

      const { deviceAuth, deviceId } = context

      // see that deviceMaintenanceStatusLogId is null
      let dmslId = await getDeviceMaintenanceStatusLogId(deviceId)
      assert.isNull(dmslId)

      /**
       * post lastCalibrated
       */
      const lastCalibrated = startOfDayUtc(subDays(now, 20))
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: {
          configuration: {
            data: {
              lastCalibrated,
            },
          },
        },
      })

      // deviceMaintenanceStatusLogId is set
      dmslId = await getDeviceMaintenanceStatusLogId(deviceId)
      assert.isDefined(dmslId)

      const where = {
        deviceId,
        deviceMaintenanceTypeId,
        current: 1,
      }

      // DeviceMaintenance.contextDate is set with posted lastCalibrated
      const { contextDate: calibratedOn } = await getDeviceMaintenance(where)
      assert.equal(lastCalibrated.toISOString(), calibratedOn.toISOString())

      /**
       * post lastCalibrated as of 2 days before last calibration
       */
      const lastCalibratedAttempt = subDays(lastCalibrated, 2)
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: {
          configuration: {
            data: {
              lastCalibrated: lastCalibratedAttempt,
            },
          },
        },
      })

      // deviceMaintenanceStatusLogId is set
      dmslId = await getDeviceMaintenanceStatusLogId(deviceId)
      assert.isDefined(dmslId)

      // DeviceMaintenance.contextDate is NOT set with just posted lastCalibrated
      const { contextDate } = await getDeviceMaintenance(where)
      assert.notEqual(lastCalibratedAttempt.toISOString(), contextDate.toISOString())
      // ... it's value remained unchanged because posted lastCalibrated is before than saved value
      assert.equal(lastCalibrated.toISOString(), calibratedOn.toISOString())

      /**
       * post newer lastCalibrated
       */
      const lastCalibratedNew = addDays(lastCalibrated, 2)
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: {
          configuration: {
            data: {
              lastCalibrated: lastCalibratedNew,
            },
          },
        },
      })

      // deviceMaintenanceStatusLogId is set
      dmslId = await getDeviceMaintenanceStatusLogId(deviceId)
      assert.isDefined(dmslId)

      // DeviceMaintenance.contextDate is set with just posted lastCalibrated
      const newDeviceMaintenance = await getDeviceMaintenance(where)
      assert.equal(lastCalibratedNew.toISOString(), newDeviceMaintenance.contextDate.toISOString())
    })
  })

  describe('when labContact* and/or installer* are included in the configuration data payload', () => {
    const now = new Date()
    const labContactName = `Lab Contact ${now.getTime()}`
    const installerName = `Installer ${now.getTime()}`
    const configurationData = {
      culture: 'en-US',
      timezone: 'Myanmar Standard Time',
      labContactName,
      labContactEmail: 'test@contract.co',
      labContactCell: '+27800243232',
      installerName,
      installerEmail: 'another@email.io',
      installerCell: '+27831238183',
    }
    let personIds = []
    const getPerson = async name =>
      getPeopleBase()
        .where('p.name', name)
        .groupBy('p.id')
        .first('p.id', 'p.name', 'p.email', 'p.email2', 'p.cell', 'j.id as jobId')

    beforeEach(() => {
      personIds = []
    })
    afterEach(async () => {
      await knex('JobContext').where('siteId', context.siteId).del()
      await knex('Job').whereIn('personId', personIds).del()
      await knex('Person')
        .where(builder => {
          builder.whereIn('name', [labContactName, installerName]).whereIn('id', personIds)
        })
        .del()
    })

    it('should check contact with posted name/email and may create Contact and/or assign it to site of device', async () => {
      const { deviceAuth, siteId } = context

      // no Person with such name
      let person = await knex('Person').where('name', labContactName).first()
      assert.isUndefined(person)
      ;[person] = [await knex('Person').where('name', installerName).first()]
      assert.isUndefined(person)

      /**
       * post and create person
       */
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: {
          configuration: {
            data: {
              ...configurationData,
            },
          },
        },
      })

      // created Person for labContactName
      ;[person] = [await getPerson(labContactName)]
      personIds.push(person.id)
      assert.isDefined(person)
      assert.isDefined(person.jobId)
      assert.equal(person.email, configurationData.labContactEmail)
      assert.equal(person.cell, configurationData.labContactCell)
      // created Person for installerName
      const installer = await getPerson(installerName)
      personIds.push(installer.id)
      assert.isDefined(installer)
      assert.isDefined(installer.jobId)
      assert.equal(installer.email, configurationData.installerEmail)
      assert.equal(installer.cell, configurationData.installerCell)

      /**
       * person is assigned to device's site as Lab User
       */
      const { id: jobFunctionIdLab } = await knex('JobFunction').where({ name: 'Lab User' }).first('id')

      // person's job for Lab User
      const job = await knex('Job').where('id', person.jobId).first()
      assert.equal(job.personId, person.id)
      assert.equal(job.jobFunctionId, jobFunctionIdLab)

      // site assignment
      const jobContext = await knex('JobContext')
        .where({
          jobId: person.jobId,
          siteId,
        })
        .first()
      assert.isDefined(jobContext)

      /**
       * post another email/cell and check that email/cell of the person didn't change
       */
      const labContactEmailNew = 'another-test@contract.co'
      const labContactCellNew = '+111-222-3333'
      await postToDeviceApi({
        authHeader: deviceAuth,
        payload: {
          configuration: {
            data: {
              ...configurationData,
              labContactEmail: labContactEmailNew,
              labContactCell: labContactCellNew,
            },
          },
        },
      })
      // NOT created Person for new email
      const personNew = await getPerson(labContactName)
      assert.isDefined(personNew)
      assert.equal(person.id, personNew.id)
      assert.equal(person.email, personNew.email)
      assert.equal(person.cell, personNew.cell)
    })
  })
})
