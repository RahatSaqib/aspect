const chai = require('chai')
const uuid = require('node-uuid')
const subSeconds = require('date-fns/subSeconds')
const { knex } = require('../../src/db')
const server = require('../utils/testUtils')
const { deviceApprovalToId } = require('../../src/shared/dictionary')
const { insertSite } = require('../../src/site/common/db')

const { assert } = chai

describe('Device API Raw routes for Truenat Authentication & Result Upload', () => {
  const deviceApiRawPath = '/device/raw'
  let truenatDevice
  before(async () => {
    truenatDevice = await knex('DeviceType as dt')
      .join('Device as d', 'dt.id', 'd.deviceTypeId')
      .join('Site as s', 'd.siteId', 's.id')
      .join('DeviceApiKey as dak', 'd.deviceApiKeyId', 'dak.id')
      .whereNotNull('dak.username')
      .andWhere({
        'dak.revoked': false,
        'dt.externalId': 'molbioTruenat',
      })
      .first('d.id', 'dak.username', 's.shortName as password')
  })

  async function authenticateWithTruelabApi(username, password) {
    return server.post(`${deviceApiRawPath}/truelab/devices/login`).send({
      Username: username,
      Password: password,
    })
  }

  describe('Truelab authentication route', () => {
    it('should respond with a bearer token, a username and a successful flag when valid credentials are sent', async () => {
      const { body } = await authenticateWithTruelabApi(truenatDevice.username, truenatDevice.password)
      assert.isOk(body.token)
      assert.match(body.token, /^Bearer\s/)
      assert.isOk(body.username)
      assert.isTrue(body.success)
    })

    it('should respond with 401 when invalid credentials are sent', async () => {
      const response = await authenticateWithTruelabApi(truenatDevice.username, 'BAD PASSWORD')
      const { status } = response
      assert.equal(status, 401)
    })
  })

  describe('Truelab result upload route', () => {
    const defaultPayload = {
      Age: '55',
      Ct1: '19.0',
      Ct2: '10.39',
      Ct3: 'ND',
      CtLabel1: 'Control',
      CtLabel2: 'E gene',
      CtLabel3: 'Orf1A',
      CtResult1: 'DETECTED High',
      CtResult2: 'DETECTED High',
      CtResult3: 'NOT DETECTED',
      Date: '2020-09-27',
      DoctorName: 'Dr Alban Aloha',
      FinalResult: 'Positive',
      Gender: 'Male',
      LabName: 'Some Molbio Truenat Lab',
      Notes: 'The test ran and the result was interpreted',
      PatientID: '23894723890472349',
      PatientName: 'James Teether',
      SampleType: 'Sputum',
      Status: 'Stopped',
      TestName: 'MTB Plus',
      Time: '22-40-58',
      User: 'InitTesti',
      ValidityStatus: 'Valid',
    }
    async function sendResult(authHeaderValue, resultPayload) {
      return server
        .post(`${deviceApiRawPath}/truelab/results/upload`)
        .set('Authorization', authHeaderValue)
        .send(resultPayload)
    }

    describe('when the device API key token is still valid', () => {
      let authHeaderValue
      before(async () => {
        const { body } = await authenticateWithTruelabApi(truenatDevice.username, truenatDevice.password)
        authHeaderValue = body.token
      })

      it('should create new results', async () => {
        const { maxId: lastResultIdBefore } = await knex('Result').max('id as maxId').first()
        const newIdValue = uuid.v4()
        const response = await sendResult(authHeaderValue, {
          ...defaultPayload,
          PatientID: newIdValue,
        })
        const { maxId: lastResultIdAfter } = await knex('Result').max('id as maxId').first()
        assert.isAbove(lastResultIdAfter, lastResultIdBefore)
        const {
          body: { resultExternalId, success },
        } = response
        assert.isTrue(success)
        const result = await knex('Result').where('externalId', resultExternalId).first()
        assert.isAbove(result.id, lastResultIdBefore)
        const patient = JSON.parse(result.patientData)
        assert.equal(patient.id, newIdValue)
      })

      it('should update existing results', async () => {
        const { maxId: lastResultIdBefore } = await knex('Result').max('id as maxId').first()
        const newIdValue = uuid.v4()
        const firstUploadResponse = await sendResult(authHeaderValue, {
          ...defaultPayload,
          PatientID: newIdValue,
        })
        const {
          body: { resultExternalId: createdResultExternalId },
        } = firstUploadResponse
        const resultCreated = await knex('Result').where('externalId', createdResultExternalId).first()
        assert.isAbove(resultCreated.id, lastResultIdBefore)
        const createdResultPatient = JSON.parse(resultCreated.patientData)
        assert.equal(createdResultPatient.age, defaultPayload.Age)

        const secondUploadResponse = await sendResult(authHeaderValue, {
          ...defaultPayload,
          PatientID: newIdValue,
          Age: 66,
        })
        const {
          body: { resultExternalId: updatedResultExternalId },
        } = secondUploadResponse
        const resultUpdated = await knex('Result').where('externalId', updatedResultExternalId).first()
        assert.equal(resultUpdated.id, resultCreated.id)
        const patient = JSON.parse(resultUpdated.patientData)
        assert.equal(patient.id, newIdValue)
        assert.equal(patient.age, 66)
      })
    })

    describe('after the device API key token has expired', () => {
      let authHeaderValue
      before(async () => {
        const { body } = await authenticateWithTruelabApi(truenatDevice.username, truenatDevice.password)
        authHeaderValue = body.token
        const { id: deviceApiKeyId } = await knex('DeviceApiKey')
          .where(knex.raw("CONCAT('Bearer ', token) = ?", authHeaderValue))
          .first('id')
        await knex('DeviceApiKey')
          .where('id', deviceApiKeyId)
          .update({ expiresOn: subSeconds(new Date(), 1) })
      })

      it('should still accept the same token and process the upload', async () => {
        const newIdValue = uuid.v4()
        const { status } = await sendResult(authHeaderValue, {
          ...defaultPayload,
          PatientID: newIdValue,
        })
        assert.equal(status, 201)
      })
    })

    describe('when unapproved device sends result with a lab name', () => {
      const unapprovedDevice = {
        username: 'tempUnapprovedTruenatDevice',
        password: 'Password_123',
      }
      const fullLabName = 'Unapproved Device Full Lab Name'
      let site
      before(async () => {
        const defaultPartner = await knex('Partner').where({ isDefault: true }).first('id')
        site = {
          name: fullLabName,
          shortName: 'short name',
          partnerId: defaultPartner.id,
          externalId: 'externalId',
          notes: '',
          createdOn: new Date(),
          updatedOn: new Date(),
        }
        const [siteId] = await insertSite(knex, site)
        site.id = siteId
        await authenticateWithTruelabApi(unapprovedDevice.username, unapprovedDevice.password)
      })

      after(async () => {
        const {
          id: unapprovedDeviceApiKeyId,
          deviceId: unapprovedDeviceId,
          siteId: unapprovedDeviceSiteId,
        } = await knex('DeviceApiKey as dak')
          .leftJoin('Device as d', 'd.deviceApiKeyId', 'dak.id')
          .where('dak.username', unapprovedDevice.username)
          .first('dak.id', 'd.id as deviceId', 'dak.siteId')
        await knex('Result').where('deviceId', unapprovedDeviceId).delete()
        await knex('Device').where('id', unapprovedDeviceId).update({ deviceApiKeyId: null })
        await knex('DeviceApiKey').where('id', unapprovedDeviceApiKeyId).delete()
        await knex('DeviceLog').where('deviceApiKeyId', unapprovedDeviceApiKeyId).delete()
        await knex('Device').where('id', unapprovedDeviceId).delete()
        await knex('Site').where('id', unapprovedDeviceSiteId).delete()
      })
    })

    describe('when approved device sends result with a lab name', () => {
      const approvedDevice = {
        username: 'tempApprovedTruenatDevice',
        password: 'Password_123',
      }
      const fullLabName = 'Approved Device Full Lab Name'
      let authHeaderValue
      let site
      before(async () => {
        const defaultPartner = await knex('Partner').where({ isDefault: true }).first('id')
        site = {
          name: fullLabName,
          shortName: 'short name',
          partnerId: defaultPartner.id,
          externalId: 'externalId',
          notes: '',
          createdOn: new Date(),
          updatedOn: new Date(),
        }
        const [siteId] = await insertSite(knex, site)
        site.id = siteId
        const { body } = await authenticateWithTruelabApi(approvedDevice.username, approvedDevice.password)
        const { deviceId } = await knex('DeviceApiKey as dak')
          .leftJoin('Device as d', 'd.deviceApiKeyId', 'dak.id')
          .where('dak.username', approvedDevice.username)
          .first('d.id as deviceId')
        const approvedDeviceApprovalId = await deviceApprovalToId('approved')
        await knex('Device').where('id', deviceId).update({ deviceApprovalId: approvedDeviceApprovalId })
        authHeaderValue = body.token
      })

      it('should process result without modifying site or device', async () => {
        const payload = {
          Age: '55',
          Ct1: '19.0',
          Ct2: '10.39',
          Ct3: 'ND',
          CtLabel1: 'Control',
          CtLabel2: 'E gene',
          CtLabel3: 'Orf1A',
          CtResult1: 'DETECTED High',
          CtResult2: 'DETECTED High',
          CtResult3: 'NOT DETECTED',
          Date: '2020-09-27',
          DoctorName: 'Dr Alban Aloha',
          FinalResult: 'Positive',
          Gender: 'Male',
          LabName: fullLabName,
          Notes: 'The test ran and the result was interpreted',
          PatientID: '23894723890472349',
          PatientName: 'James Teether',
          SampleType: 'Sputum',
          Status: 'Stopped',
          TestName: 'MTB Plus',
          Time: '22-40-58',
          User: 'InitTesti',
          ValidityStatus: 'Valid',
        }

        const response = await sendResult(authHeaderValue, {
          ...payload,
          PatientID: uuid.v4(),
        })
        const {
          body: { success },
        } = response
        assert.isTrue(success)

        const { deviceId, siteId } = await knex('DeviceApiKey as dak')
          .leftJoin('Device as d', 'd.deviceApiKeyId', 'dak.id')
          .where('dak.username', approvedDevice.username)
          .first('d.id as deviceId', 'dak.siteId')
        assert.notEqual(siteId, site.id, 'device.siteId should not point to site with full lab name')
        const { name: deviceName } = await knex('Device').where('id', deviceId).first('name')
        // Device names are now generated as ${acronym}${id} (ASP-7977); the original
        // intent of this assertion is that the Truenat LabName field must not rename the device.
        assert.notEqual(deviceName, fullLabName, 'device name should not be overwritten by the result LabName')
      })

      after(async () => {
        const {
          id: approvedDeviceApiKeyId,
          deviceId: approvedDeviceId,
          siteId: approvedDeviceSiteId,
        } = await knex('DeviceApiKey as dak')
          .leftJoin('Device as d', 'd.deviceApiKeyId', 'dak.id')
          .where('dak.username', approvedDevice.username)
          .first('dak.id', 'd.id as deviceId', 'dak.siteId')
        await knex('DeviceApiRaw').where('deviceApiKeyId', approvedDeviceApiKeyId).delete()
        await knex('Result').where('deviceId', approvedDeviceId).delete()
        await knex('Device').where('id', approvedDeviceId).update({ deviceApiKeyId: null })
        await knex('DeviceApiKey').where('id', approvedDeviceApiKeyId).delete()
        await knex('DeviceLog').where('deviceApiKeyId', approvedDeviceApiKeyId).delete()
        await knex('Device').where('id', approvedDeviceId).delete()
        await knex('Site').where('id', approvedDeviceSiteId).delete()
      })
    })
  })
})
