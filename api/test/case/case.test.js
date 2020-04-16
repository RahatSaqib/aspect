const { assert } = require('chai')
const { getFirstCase, getFirstPartnerId } = require('./utils')
const { getCaseId, removeCase, addCase } = require('../../src/case/service')

describe('case/service', () => {
  let partnerId = null

  before(async () => {
    partnerId = await getFirstPartnerId()
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
