const supertest = require('supertest')
const _ = require('lodash')
const { assert } = require('chai')
const {
  getFirstCase,
  getFirstPartnerId,
  getFirstDiseaseId,
} = require('./utils')
const { getAdminId } = require('../utils/authUtils')
const { getAccessToken } = require('../utils/authUtils')
const {
  addCase,
  getCaseId,
  removeCase,
  updateCase,
} = require('../../src/case/service')
const { createMessageContext, waitForAction } = require('../utils/mqUtils')
const { caseAdded, caseUpdated } = require('../../src/case/actions')

const server = supertest.agent('http://localhost:8080')

function assertPropsOnList(res) {
  assert.property(res.body.data[0], 'id')
  assert.property(res.body.data[0], 'externalId')
  assert.property(res.body.data[0], 'attendingClinic')
  assert.property(res.body.data[0], 'diseaseName')
  assert.property(res.body.data[0], 'diseaseId')
  assert.property(res.body.data[0], 'diseaseExternalId')
  assert.property(res.body.data[0], 'status')
  assert.property(res.body.data[0], 'patientId')
  assert.property(res.body.data[0], 'createdBy')
  assert.property(res.body.data[0], 'updatedBy')
  assert.property(res.body.data[0], 'createdOn')
  assert.property(res.body.data[0], 'updatedOn')
}

describe.only('case/service', () => {
  let partnerId = null
  let diseaseId = null
  let accessToken = null
  let adminId = null
  const path = '/api/case'
  let messageContext

  // helpers
  const getExternalId = () =>
    `${Date.now()}_${Math.floor(Math.random() * 10000)}`
  const mockCase = externalId => {
    return {
      createdBy: adminId,
      updatedBy: adminId,
      partnerId,
      externalId,
    }
  }

  before(async () => {
    partnerId = await getFirstPartnerId()
    diseaseId = await getFirstDiseaseId(partnerId)
    accessToken = await getAccessToken('admin', 'test07')
    adminId = await getAdminId()

    messageContext = await createMessageContext()
    messageContext.bindActionCreators({ caseAdded, caseUpdated })
  })

  describe('GET', () => {
    let caseToTest = null

    it('Should return a list of cases', async () => {
      const res = await server
        .get(path)
        .set('Authorization', `Bearer ${accessToken}`)
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isNotNull(res.body.data)
      assert.isAtLeast(res.body.data.length, 1)
      assertPropsOnList(res)
      ;[caseToTest] = res.body.data
    })

    it('Should return a list of cases filtered by patientOrResearchId', async () => {
      const res = await server
        .get(`${path}?patientOrResearchId=${caseToTest.patientId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isNotNull(res.body.data)
      assert.isAtLeast(res.body.data.length, 1)
      assertPropsOnList(res)
      assert.equal(res.body.data[0].id, caseToTest.id)
    })

    it('Should return a list of cases filtered by diseaseId', async () => {
      const res = await server
        .get(`${path}?diseaseId=${diseaseId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isNotNull(res.body.data)
      assert.isAtLeast(res.body.data.length, 1)
      assertPropsOnList(res)
    })

    it('Should return an empty list', async () => {
      const unexistentClinicId = _.random(1000000, 9999999)

      const res = await server
        .get(`${path}?sampleOriginSite=${unexistentClinicId}`)
        .set('Authorization', `Bearer ${accessToken}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isNotNull(res.body.data)
      assert.equal(res.body.data.length, 0)
    })
  })

  describe('add / update', () => {
    let caseId
    it('Should add case and return the id', async () => {
      const objCase = mockCase(`Some externalId ${getExternalId()}`)

      caseId = await addCase(objCase, { messageContext })
      assert.isNotNull(caseId)

      // check that MQ handled action with actual values
      const waitForCaseAdded = waitForAction(caseAdded(caseId))
      await waitForCaseAdded
    })

    it('Should update case and handle MQ message', async () => {
      const caseIds = await updateCase(
        { id: caseId },
        { externalId: `Changed externalId ${getExternalId()}` },
        { messageContext }
      )
      assert.isNotNull(caseIds)
      assert.isArray(caseIds)
      assert.isNotEmpty(caseIds)

      await Promise.all(
        caseIds.map(caseId => waitForAction(caseUpdated(caseId)))
      )
    })
  })

  describe('remove', () => {
    it('Should remove case', async () => {
      const objCase = mockCase(
        `non existent externalId ${Math.floor(Math.random() * 10000)}`
      )

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
      const objCase = mockCase(
        `non existent externalId ${Math.floor(Math.random() * 10000)}`
      )

      const caseId = await getCaseId(objCase, createIfNonExistent, adminId)
      await removeCase(objCase)
      assert.isNotNull(caseId)
    })

    it("Providing a non existent externalId, partnerId and not allowing create it, shouldn't create a new case and return null", async () => {
      const createIfNonExistent = false

      const objCase = mockCase(
        `non existent externalId ${Math.floor(Math.random() * 10000)}`
      )

      const caseId = await getCaseId(objCase, createIfNonExistent)
      assert.isNull(caseId)
    })
  })
})
