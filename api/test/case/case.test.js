const { assert } = require('chai')
const { runTest } = require('../utils/generatorFunctionUtils')
const {
  getCaseId,
  removeCase,
  getFirstCase,
  addCase,
} = require('../../src/case/service')

describe.only('case/service', () => {
  describe.only('add', () => {
    it('Should add case', async () => {
      const objCase = {
        externalId: `non existent externalId ${Math.floor(
          Math.random() * 10000
        )}`,
      }
      return runTest(addCase, [objCase])(response => {
        assert.isNotNull(response)
      })
    })
  })

  describe.only('remove', () => {
    it('Should remove case', async () => {
      const objCase = {
        externalId: `non existent externalId ${Math.floor(
          Math.random() * 10000
        )}`,
      }
      await addCase(objCase)
      return runTest(removeCase, [objCase])(response => {
        assert.isTrue(response)
      })
    })
  })

  describe.only('getCaseId', () => {
    it('Providing an existent externalId and partnerId, should return the id of the case', async () => {
      const existentCase = await getFirstCase()
      return runTest(getCaseId, [
        {
          externalId: existentCase.externalId,
          partnerId: existentCase.partnerId,
        },
      ])(response => {
        assert.equal(response, existentCase.id)
      })
    })

    it("Providing a non existent externalId and allowing create it, should create a new case and return it's id", async () => {
      const createIfNonExistent = true
      const objCase = {
        externalId: `non existent externalId ${Math.floor(
          Math.random() * 10000
        )}`,
      }

      return runTest(getCaseId, [objCase, createIfNonExistent])(response => {
        removeCase(objCase)
        assert.isNotNull(response)
      })
    })

    it("Providing a non existent externalId and not allowing create it, shouldn't create a new case and return null", async () => {
      const createIfNonExistent = false
      const objCase = {
        externalId: `non existent externalId ${Math.floor(
          Math.random() * 10000
        )}`,
      }

      return runTest(getCaseId, [objCase, createIfNonExistent])(response => {
        if (response) removeCase()
        assert.isNull(response)
      })
    })
  })
})
