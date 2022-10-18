const chai = require('chai')
const uuid = require('node-uuid')
const subSeconds = require('date-fns/subSeconds')
const { knex } = require('../../src/db')
const server = require('../utils/testUtils')

const { assert } = chai

describe('Device API Raw routes for Truenat Authentication & Result Upload', () => {
  const deviceApiRawPath = '/device/raw'
  let truenatDevice
  before(async () => {
    truenatDevice = await knex('DeviceType as dt')
      .join('Device as d', 'dt.id', 'd.deviceTypeId')
      .join('Site as s', 'd.siteId', 's.id')
      .join('DeviceApiKey as dak', 'd.id', 'dak.deviceId')
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

      it('should return a 401 response', async () => {
        const newIdValue = uuid.v4()
        const { status } = await sendResult(authHeaderValue, {
          ...defaultPayload,
          PatientID: newIdValue,
        })
        assert.equal(status, 401)
      })
    })
  })
})
