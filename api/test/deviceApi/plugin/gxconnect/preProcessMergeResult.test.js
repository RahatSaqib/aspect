const proxyquire = require('proxyquire')
const { assert } = require('chai')
const sinon = require('sinon')
const { run } = require('../../../utils/generatorFunctionUtils')

describe('GxConnect Merge Result PreProcess Plugin', () => {
  let dbSpy
  let preProcessMergeResult

  beforeEach(() => {
    dbSpy = require('../../../utils/dbSpy')
    sinon.spy(dbSpy, 'query')
    preProcessMergeResult = proxyquire
      .noCallThru()
      .load(
        '../../../../src/deviceApi/plugin/gxconnect/preProcessMergeResult',
        {
          '../../../db': dbSpy,
        }
      )
  })

  afterEach(() => {
    dbSpy.query.restore()
  })

  describe('When no device ID is present', () => {
    it('should ignore the request', () =>
      run(preProcessMergeResult, [{}])(
        response => {
          assert.fail(response)
        },
        exception => {
          assert.deepEqual(exception.output, {
            statusCode: 404,
            payload: {
              statusCode: 404,
              error: 'Not Found',
              message: 'Cannot find device',
            },
            headers: {},
          })
        }
      ))
  })
})
