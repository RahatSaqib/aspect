const chai = require('chai')
const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const server = require('../utils/testUtils')

const { assert } = chai

describe('Global reports', () => {
  const path = '/api/reports'

  describe('GET', () => {
    shared.checkToken(server, path)

    let reportExternalId

    it('should return list of reports with minimum few global reports', () =>
      runTestWithKnex(async () => {
        await server
          .get(`${path}`)
          .set('Authorization', `Bearer ${shared.token}`)
          .then(async res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
            assert.property(res.body, 'ok')
            assert.property(res.body, 'total')
            assert.property(res.body, 'data')

            assert.equal(res.body.ok, true)
            assert.isAtLeast(res.body.total, 1)

            assert.typeOf(res.body.data, 'array')
            assert.isAtLeast(res.body.data.length, 1)

            // check returned props
            assert.property(res.body.data[0], 'name')
            assert.property(res.body.data[0], 'description')
            assert.property(res.body.data[0], 'externalId')
            assert.property(res.body.data[0], 'sortOrder')

            reportExternalId = res.body.data[0].externalId
          })
      }))

    it('should return binary stream with Excel file for report requested with `externalId`', async () => {
      await server
        .get(`${path}/${reportExternalId}`)
        .set('Authorization', `Bearer ${shared.token}`)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')

          // special header Content-Disposition for generated Excel file is used to specify file name
          assert.typeOf(res.headers['content-disposition'], 'string')
          assert.equal(
            res.headers['content-disposition'].includes('attachment'),
            true
          )
          assert.equal(
            res.headers['content-disposition'].includes('filename='),
            true
          )

          // Content-Type should match Excel file with extension .xlsx
          assert.typeOf(res.headers['content-type'], 'string')
          assert.equal(
            res.headers['content-type'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          )
        })
    })
  })
})
