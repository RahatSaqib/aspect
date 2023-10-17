const { assert } = require('chai')
const proxyquire = require('proxyquire')
const sinon = require('sinon')
const _ = require('lodash')
const Promise = require('bluebird')

describe('result/service', () => {
  function createFakeKnex({ getResultByResultId = {}, assay = {} } = {}) {
    const fakeKnexFunction = tableName => {
      let firstResult = {}
      let selectResult = []
      if (tableName === 'Assay as a') {
        firstResult = _.cloneDeep(assay)
      } else if (tableName === 'Result as r') {
        selectResult = _.isEmpty(getResultByResultId) ? [] : [_.cloneDeep(getResultByResultId)]
      } else if (tableName === 'Device') {
        firstResult = { id: 1 }
      }
      this.join = () => this
      this.innerJoin = () => this
      this.leftJoin = () => this
      this.where = () => this
      this.modify = () => this
      this.orderBy = () => this
      this.raw = () => this
      this.select = () => {
        const resultsPromise = Promise.resolve(selectResult)
        resultsPromise.map = () => resultsPromise
        return resultsPromise
      }
      this.first = () => Promise.resolve(firstResult)
      this.update = () => Promise.resolve()
      this.insert = () => Promise.resolve([1])
      this.from = () => this
      this.whereIn = () => this
      this.groupBy = () => this
      this.as = () => this
      return this
    }
    return _.merge(fakeKnexFunction, fakeKnexFunction())
  }

  function resultServiceWithFakes(knexResults, extraServices = {}) {
    const fakeKnex = createFakeKnex(knexResults)
    const resultService = proxyquire(
      '../../src/result/service',
      _.merge(
        {
          '../db': { knex: fakeKnex },
          '../auth/constraints': {
            getConstraints: () => {},
            addConstraints: () => {},
          },
          '../auth/service': {
            getUser: () =>
              Promise.resolve({
                id: 1,
                userName: 'Admin',
                partnerId: 1,
              }),
          },
          '../shared/dictionary': {
            deviceTypeToId: async externalId => {
              let returnValue
              if (externalId === 'Aspect') {
                returnValue = 3
              }
              return Promise.resolve(returnValue)
            },
          },
          '../site/service': {
            getSite: async () => Promise.resolve(null),
          },
          '../device/service': {
            getDeviceByDeviceId: async () => Promise.resolve(null),
          },
        },
        extraServices
      )
    )
    resultService.knex = fakeKnex
    sinon.spy(resultService, 'knex')
    return resultService
  }

  function basicRequest(extraDetails = {}, knex) {
    if (!knex) {
      knex = createFakeKnex()
    }
    return _.merge(
      {
        auth: { credentials: {} },
        params: { resultId: 1 },
        payload: {},
        plugins: {
          messageContext: {
            bindActionCreators: () => {},
            transact: async transaction => transaction(knex),
            resultUpdated: sinon.spy(),
            queue: {
              waitForAction: async () => Promise.reject(),
            },
          },
        },
      },
      extraDetails
    )
  }

  function siteServiceMock() {
    return {
      getSite: () =>
        Promise.resolve({
          id: 1,
        }),
    }
  }

  function assayServiceMock() {
    return {
      getAllAssaySchemas: () =>
        Promise.resolve([
          {
            id: 1,
          },
        ]),
      getAssayResultCategories: () =>
        Promise.resolve([
          {
            id: 1,
          },
          {
            id: 2,
          },
        ]),
    }
  }

  function assayMissingServiceMock() {
    return {
      getAllAssaySchemas: () => Promise.resolve([]),
      getAssayResultCategories: () => Promise.resolve([]),
    }
  }

  describe('createResult', () => {
    function resultCreatePayload(extraPayload = {}) {
      const payload = _.merge(
        {
          assayId: 1,
          siteId: 1,
        },
        extraPayload
      )
      return { payload }
    }

    it('should return a 404 response when the site cannot be found', async () => {
      const resultService = resultServiceWithFakes({})

      const response = await resultService.createResult(basicRequest(resultCreatePayload()))
      assert.equal(response.output.statusCode, 404)
      assert.equal(response.output.payload.message, 'This site does not exist or you do not have access.')
    })

    it('should return a 404 response when the assay cannot be found', async () => {
      const resultService = resultServiceWithFakes(
        {},
        {
          '../site/service': siteServiceMock(),
          '../assay/service': assayMissingServiceMock(),
        }
      )

      const response = await resultService.createResult(basicRequest(resultCreatePayload()))
      assert.equal(response.output.statusCode, 404)
      assert.equal(response.output.payload.message, 'This assay does not exist or you do not have access.')
    })

    it('should return a 400 response when the selected result does not apply to the assay', async () => {
      const resultService = resultServiceWithFakes(
        {},
        {
          '../site/service': siteServiceMock(),
          '../assay/service': assayServiceMock(),
        }
      )

      const response = await resultService.createResult(basicRequest(resultCreatePayload({ resultCategory1: 99 })))
      assert.equal(response.output.statusCode, 400)
      assert.equal(response.output.payload.message, 'The selected result is not valid for this assay.')
    })

    it('should return a 404 response when the device cannot be found', async () => {
      const resultService = resultServiceWithFakes(
        {},
        {
          '../site/service': siteServiceMock(),
          '../assay/service': assayServiceMock(),
        }
      )

      const response = await resultService.createResult(
        basicRequest(resultCreatePayload({ resultCategory1: 1, deviceId: 99 }))
      )
      assert.equal(response.output.statusCode, 404)
      assert.equal(response.output.payload.message, 'This device does not exist or you do not have access.')
    })
  })
})
