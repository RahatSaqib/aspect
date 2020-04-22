const supertest = require('supertest')
const { assert } = require('chai')
const { getFirstCase, getFirstPartnerId } = require('./utils')
const { getAccessToken } = require('../utils/authUtils')
const { getCaseId, removeCase, addCase } = require('../../src/case/service')

const server = supertest.agent('http://localhost:8080')

describe.only('case/service', () => {
  let partnerId = null

  before(async () => {
    partnerId = await getFirstPartnerId()
  })

  describe.only('Case Routes', () => {
    const path = '/api/case'
    
    it('GET', async () => {
      const accessToken = await getAccessToken('admin', 'test07')

      const res = await server
        .get(path)
        .set('Authorization', `Bearer ${accessToken}`)
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      // assert.isAtLeast(res.body.data.length, 3)
      // assert.property(res.body.data[0], 'id')
      // assert.property(res.body.data[0], 'externalId')
      // assert.property(res.body.data[0], 'endedOn')
      // assert.property(res.body.data[0], 'deviceName')
      // assert.property(res.body.data[0], 'sampleOriginSiteName')
      // assert.property(res.body.data[0], 'sampleId')
      // assert.property(res.body.data[0], 'resultText')
      // assert.property(res.body.data[0], 'errorCode')
      // assert.property(res.body.data[0], 'resultWorkflowStatus')
      // assert.property(res.body.data[0], 'resultTreatmentStatus')
      // assert.property(res.body.data[0], 'treatmentStatusInfo')
      // assert.property(res.body.data[0], 'patientId')
      // assert.property(res.body.data[0], 'assayId')
      // assert.property(res.body, 'total')
    })
  })

  describe('add', () => {
    it('Should add case and return the id', async () => {
      const objCase = {
        externalId: `non existent externalId ${Math.floor(
          Math.random() * 10000
        )}`,
        partnerId,
      }
      const caseId = await addCase(objCase)
      assert.isNotNull(caseId)
    })
  })

  describe('remove', () => {
    it('Should remove case', async () => {
      const objCase = {
        externalId: `non existent externalId ${Math.floor(
          Math.random() * 10000
        )}`,
        partnerId,
      }
      await addCase(objCase)
      await removeCase(objCase)
      const caseId = await getCaseId(objCase)
      assert.isNull(caseId)
    })
  })

  describe('getCaseId', () => {
    it('Providing an existent externalId and partnerId, should return the id of the case', async () => {
      const existentCase = await getFirstCase()
      const caseId = await getCaseId({
        externalId: existentCase.externalId,
        partnerId: existentCase.partnerId,
      })
      assert.equal(caseId, existentCase.id)
    })

    it("Providing a non existent externalId, partnerId and allowing create it, should create a new case and return it's id", async () => {
      const createIfNonExistent = true
      const objCase = {
        externalId: `non existent externalId ${Math.floor(
          Math.random() * 10000
        )}`,
        partnerId,
      }

      const caseId = await getCaseId(objCase, createIfNonExistent)
      await removeCase(objCase)
      assert.isNotNull(caseId)
    })

    it("Providing a non existent externalId, partnerId and not allowing create it, shouldn't create a new case and return null", async () => {
      const createIfNonExistent = false
      const objCase = {
        externalId: `non existent externalId ${Math.floor(
          Math.random() * 10000
        )}`,
        partnerId,
      }

      const caseId = await getCaseId(objCase, createIfNonExistent)
      assert.isNull(caseId)
    })
  })
})
