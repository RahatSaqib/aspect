const chai = require('chai')
const { subYears, subMonths } = require('date-fns')

const shared = require('../utils/sharedToken')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const server = require('../utils/testUtils')

const { assert } = chai

describe('API Reports Endpoint', () => {
  describe('GET: /api/reports/critical_errors_by_module', () => {
    const apiPath = '/api/reports/critical_errors_by_module'

    before(() => {
      shared.checkToken(server, apiPath)
    })

    it('should return response for critical errors by module report', () =>
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

        // Add assertion on the response received from the above console.log in the terminal
        assert.equal(csvArray[0][0], 'Errors by Module')
        ;[
          'Deployment Name',
          'Zone',
          'District',
          'InstrumentSerial',
          'ModuleSerial',
          'Module Name',
          'Date of error',
          'Error code',
          'Error Category',
          'Error description',
          'Total Tests Run During Period',
          'Total Errors During Period',
        ].forEach((element, index) => {
          assert.equal(csvArray[6][index], element)
        })
        ;[
          '<deploymentName>',
          '<zone>',
          '<district>',
          '<instrumentSerial>',
          '<moduleSerial>',
          '<moduleName>',
          '<dateOfError>',
          '<errorCode>',
          '<errorCategory>',
          '<errorDescription>',
          '<totalRestsRunDuringPeriod>',
          '<totalErrorsDuringPeriod>',
        ].forEach((element, index) => {
          assert.equal(csvArray[7][index], element)
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
})
