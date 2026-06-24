const chai = require('chai')
const { subMonths } = require('date-fns')
const fs = require('fs')
const path = require('path')

const jwt = require('jsonwebtoken')
const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')
const { knex } = require('../../src/db')

const server = require('../utils/testUtils')
const config = require('../../src/config')

const { assert } = chai

describe('API Reports Endpoint', () => {
  describe.skip('GET: /api/reports/critical_errors_by_module', () => {
    const apiPath = '/api/reports/critical_errors_by_module'

    before(() => {
      shared.checkToken(server, apiPath)
    })

    it('should return response with csv headers for critical errors by module report', () =>
      runTestWithKnex(async () => {
        const response = await server
          .get(apiPath)
          .query({ minDate: subMonths(new Date(), 1), maxDate: new Date(), format: 'csv', timeZone: 'Asia/Calcutta' })
          .set('Authorization', `Bearer ${shared.token}`)
        assert.equal(response.status, 200)
        let csvContent = response.body.toString()

        // Remove BOM if present
        if (csvContent.charCodeAt(0) === 0xfeff) {
          csvContent = csvContent.slice(1)
        }
        assert.typeOf(csvContent, 'string')
        assert.isAbove(csvContent.length, 0)
        // convert CSV content to array of objects
        const csvArray = csvContent.split('\n').map(row => row.split(','))

        ;[
          '#',
          'Deployment Name',
          'Zone',
          'District',
          'InstrumentSerial',
          'ModuleSerial',
          'Module Name',
          'Date of error',
          'Error code',
          'Total Tests Run During Period',
          'Total Errors During Period',
        ].forEach((element, index) => {
          assert.equal(csvArray[0][index], element)
        })
      }))

    it('should return an CSV file for report requested with `externalId` if the report is not an stremeable one', async () => {
      const response = await server
        .get(apiPath)
        .query({ minDate: subMonths(new Date(), 1), maxDate: new Date(), format: 'csv' })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(response.status, 200)

      // special header Content-Disposition for generated Excel file is used to specify file name
      assert.typeOf(response.headers['content-disposition'], 'string')
      assert.equal(response.headers['content-disposition'].includes('attachment'), true)
      assert.equal(response.headers['content-disposition'].includes('filename='), true)

      // Content-Type should match CSV file with extension .csv
      assert.typeOf(response.headers['content-type'], 'string')
      assert.equal(response.headers['content-type'], 'application/octet-stream')
    })
  })

  describe.skip('GET: /api/reports/unreconciled_inventory_report', () => {
    const apiPath = '/api/reports/unreconciled_inventory_report'

    before(() => {
      shared.checkToken(server, apiPath)
    })

    it('should return response with csv headers for unreconciled inventory report', () =>
      runTestWithKnex(async () => {
        const response = await server
          .get(apiPath)
          .query({ minDate: subMonths(new Date(), 1), maxDate: new Date(), format: 'xlsx', timeZone: 'Asia/Calcutta' })
          .set('Authorization', `Bearer ${shared.token}`)
        assert.equal(response.status, 200)
      }))

    it('should return an CSV file for report requested with `externalId` if the report is not an stremeable one', async () => {
      const response = await server
        .get(apiPath)
        .query({ minDate: subMonths(new Date(), 1), maxDate: new Date(), format: 'xlsx' })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(response.status, 200)

      // special header Content-Disposition for generated Excel file is used to specify file name
      assert.typeOf(response.headers['content-disposition'], 'string')
      assert.equal(response.headers['content-disposition'].includes('attachment'), true)
      assert.equal(response.headers['content-disposition'].includes('filename='), true)

      // Content-Type should match CSV file with extension .csv
      assert.typeOf(response.headers['content-type'], 'string')
      assert.equal(response.headers['content-type'], 'application/octet-stream')
    })
  })

  describe.skip('GET: /api/reports', () => {
    const apiPath = '/api/reports'

    before(() => {
      shared.checkToken(server, apiPath)
    })

    it('should return missing unreconciled inventory report', () =>
      runTestWithKnex(async () => {
        const response = await server.get(apiPath).set('Authorization', `Bearer ${shared.token}`)
        assert.equal(response.status, 200)
        assert.isAbove(response.body.data.length, 0)

        // Assertion to find the unreconciled inventory report
        const unreconciledInventoryReport = response.body.data.find(
          report => report.externalId === 'unreconciled_inventory_report'
        )
        assert.exists(unreconciledInventoryReport)
        assert.equal(unreconciledInventoryReport.name, 'List of Unreconciled Inventory')
        assert.equal(unreconciledInventoryReport.exportExcel, true)
      }))
  })

  describe('GET: /api/reports/download', () => {
    const apiPath = '/api/reports/download'
    const testFileName = 'test.xlsx'
    const testFilePath = path.join('/tmp', testFileName)

    beforeEach(async () => {
      // Create a test file in /tmp directory
      const testContent = Buffer.from('Test Excel file content for download verification')
      await fs.promises.writeFile(testFilePath, testContent)
    })

    afterEach(async () => {
      // Clean up test file after each test
      try {
        await fs.promises.unlink(testFilePath)
      } catch (error) {
        // File might not exist, ignore error
      }
      await runTestWithKnex(() => knex('ReportDownloadLog').del())
    })

    it('should return 401 for an invalid token', async () => {
      const response = await server
        .get(apiPath)
        .query({ token: 'invalid-token' })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(response.status, 401)
      assert.equal(response.body.error, 'Invalid token')
    })

    it('should return 404 when the token is valid but the file does not exist', async () => {
      const token = jwt.sign(
        {
          report_filename: 'missing-report.xlsx',
          reportExternalId: 'all_results',
          filters: {},
          format: 'xlsx',
        },
        config.secret,
        { expiresIn: '1 hour' }
      )

      const response = await server.get(apiPath).query({ token }).set('Authorization', `Bearer ${shared.token}`)
      assert.equal(response.status, 404)
      assert.equal(response.body.error, 'File not found')

      await runTestWithKnex(async () => {
        const [logEntry] = await knex('ReportDownloadLog').orderBy('id', 'desc').limit(1)
        assert.exists(logEntry)
        assert.equal(logEntry.source, 'scheduled')
        assert.equal(logEntry.success, 0)
        assert.equal(logEntry.reportExternalId, 'all_results')
        assert.isNull(logEntry.fileSizeBytes)
      })
    })
    it('should return 200 when the token is valid and the file exists', async () => {
      const token = jwt.sign(
        {
          report_filename: testFileName,
          reportExternalId: 'all_results',
          filters: { minDate: '2024-01-01', maxDate: '2024-01-31' },
          format: 'xlsx',
        },
        config.secret,
        { expiresIn: '1 hour' }
      )

      const response = await server.get(apiPath).query({ token }).set('Authorization', `Bearer ${shared.token}`)
      assert.equal(response.status, 200)

      // Verify that the response contains the expected file content
      assert.isTrue(Buffer.isBuffer(response.body), 'Response body should be a Buffer')
      assert.exists(response.headers['content-disposition'])
      assert.equal(response.headers['content-disposition'].includes('attachment'), true)
      assert.equal(response.headers['content-disposition'].includes(`filename=${testFileName}`), true)

      // Verify the file content matches what we created
      const expectedContent = Buffer.from('Test Excel file content for download verification')
      assert.deepEqual(response.body, expectedContent)

      await runTestWithKnex(async () => {
        const [logEntry] = await knex('ReportDownloadLog').orderBy('id', 'desc').limit(1)
        assert.exists(logEntry)
        assert.equal(logEntry.source, 'scheduled')
        assert.equal(logEntry.success, 1)
        assert.equal(logEntry.reportExternalId, 'all_results')
        assert.equal(logEntry.fileSizeBytes, expectedContent.length)
        assert.equal(logEntry.generationTimeMs, 0)
        assert.isNotNull(logEntry.endedOn)
        assert.deepEqual(JSON.parse(logEntry.query), {
          minDate: '2024-01-01',
          maxDate: '2024-01-31',
        })
        assert.equal(logEntry.timeSpanDays, 30)
      })
    })

    it('should return 404 when the token has undefined report_filename', async () => {
      const response = await server
        .get(apiPath)
        .query({ token: jwt.sign({ report_filename: undefined }, config.secret, { expiresIn: '1 hour' }) })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(response.status, 404)
      assert.equal(response.body.error, 'File not found')
    })

    it('should return 400 when the token has empty report_filename', async () => {
      const response = await server
        .get(apiPath)
        .query({ token: jwt.sign({ report_filename: '' }, config.secret, { expiresIn: '1 hour' }) })
        .set('Authorization', `Bearer ${shared.token}`)
      assert.equal(response.status, 400)
      assert.equal(response.body.error, 'File is a directory')
    })
  })
})
