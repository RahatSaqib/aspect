const proxyquire = require('proxyquire')
const Promise = require('bluebird')
const { assert } = require('chai')
const { runTest } = require('../utils/generatorFunctionUtils')
const { formatDateOrDefault } = require('../../src/shared/date')

describe('stringTemplate', () => {
  describe('processUsingHandlebarsSyntax', () => {
    const {
      processUsingHandlebarsSyntax,
    } = require('../../src/stringTemplate/service')

    it('should replace matching words in the template string', () => {
      const sampleString =
        'Device in {{site.state}}, {{site.country}} is currently offline'
      const expectedResult =
        'Device in Ohio, United States is currently offline'
      const site = {
        shortName: 'Cuyoga, OH #1',
        state: 'Ohio',
        country: 'United States',
      }
      return runTest(processUsingHandlebarsSyntax, [sampleString, { site }])(
        resultString => {
          assert.deepEqual(resultString, expectedResult)
        }
      )
    })

    it('should handle missing word replacements in input inputObject', () => {
      const sampleString = 'Hello {{person.name}}'
      const expectedResult = 'Hello '
      const inputObject = {
        site: {
          shortName: 'Cuyoga, OH #1',
          state: 'Ohio',
          country: 'United States',
        },
      }
      return runTest(processUsingHandlebarsSyntax, [sampleString, inputObject])(
        resultString => {
          assert.deepEqual(resultString, expectedResult)
        }
      )
    })

    it('should handle missing value in the input object', () => {
      const sampleString = 'Device {{device.shortName}} is offline'
      const expectedResult = 'Device  is offline'
      const inputObject = {
        device: {
          state: 'Ohio',
          country: 'United States',
        },
      }
      return runTest(processUsingHandlebarsSyntax, [sampleString, inputObject])(
        resultString => {
          assert.deepEqual(resultString, expectedResult)
        }
      )
    })

    it('should handle multiple objects in the input object', () => {
      const sampleString =
        'New {{result.assayName}} result from Device {{device.shortName}} at {{site.state}}, {{site.country}}'
      const expectedResult =
        'New HivVl result from Device Eldoret #1 at Uasin Gishu, Kenya'
      const site = {
        state: 'Uasin Gishu',
        country: 'Kenya',
      }
      const device = {
        shortName: 'Eldoret #1',
        name: 'Uasin Gishu County, Eldoret #1',
      }
      const result = {
        endedOn: '2018-02-20',
        patientId: 'P001-005',
        assayName: 'HivVl',
        sampleId: 'GRP-HIV-2',
      }
      return runTest(processUsingHandlebarsSyntax, [
        sampleString,
        { site, device, result },
      ])(resultString => {
        assert.deepEqual(resultString, expectedResult)
      })
    })

    it('should format date without display preferences', () => {
      const sampleString =
        'Device {{device.shortName}} is offline since {{formatDate data.offlineOn}}'
      const expectedResult = 'Device  is offline since 2018-08-01'
      const inputObject = {
        device: {
          state: 'Ohio',
          country: 'United States',
        },
        data: {
          offlineOn: '2018-08-01',
        },
      }
      return runTest(processUsingHandlebarsSyntax, [sampleString, inputObject])(
        resultString => {
          assert.deepEqual(resultString, expectedResult)
        }
      )
    })

    it('should format date with display preferences', () => {
      const sampleString =
        'Device {{device.shortName}} is offline since {{formatDate data.offlineOn }}'
      const expectedResult = 'Device  is offline since 1/8/2018'
      const inputObject = {
        device: {
          state: 'Ohio',
          country: 'United States',
        },
        data: {
          offlineOn: '2018-08-01',
        },
        displayPreferences: {
          dateFormat: 'D/M/YYYY',
        },
      }
      return runTest(processUsingHandlebarsSyntax, [sampleString, inputObject])(
        resultString => {
          assert.deepEqual(resultString, expectedResult)
        }
      )
    })
  })

  describe('processUsingDataSourceQuery', () => {
    const displayPreferences = {
      dateFormat: 'D/M/YYYY',
      timeFormat: 'HH:mm:ss',
      dateTimeFormat: 'D/M/YYYY HH:mm:ss',
    }
    const { processUsingDataSourceQuery } = proxyquire(
      '../../src/stringTemplate/service',
      {
        '../plugin/registration': {
          loadPlugin: async () => Promise.resolve({ displayPreferences }),
        },
      }
    )

    const messageDataSource = {
      siteExternalId: 'ALTEST',
      deviceName: 'Akron Laboratory',
      deviceLastSeenOn: new Date(2018, 7, 1, 10, 51, 13),
      resultStartedOn: new Date(2018, 7, 1, 10, 16, 28),
      resultEndedOn: new Date(2018, 7, 1, 10, 18, 1),
      resultData: `{"id":1,"sampleBarcode":"SAMPLE-123"}`,
    }
    async function runProcessUsingDataSourceQuery(payloadTemplate) {
      const data = Object.assign({}, messageDataSource, { payloadTemplate })
      const templateFields = ['payloadTemplate']
      const options = { dynamic: true }
      return processUsingDataSourceQuery(data, templateFields, options)
    }

    describe('formatDate helper', () => {
      it('should format date with display preferences as default', async () => {
        const message = await runProcessUsingDataSourceQuery(
          'Offline since {{formatDate device.lastSeenOn}}'
        )
        assert.equal(
          message.payload,
          `Offline since ${formatDateOrDefault(
            messageDataSource.deviceLastSeenOn,
            displayPreferences.dateFormat
          )}`
        )
      })

      it('should format date with a specific format is specified', async () => {
        const specifiedFormat = 'YYYY-MM-DDHH:mm'
        const message = await runProcessUsingDataSourceQuery(
          `Offline since {{formatDate device.lastSeenOn formatString='${specifiedFormat}'}}`
        )
        assert.equal(
          message.payload,
          `Offline since ${formatDateOrDefault(
            messageDataSource.deviceLastSeenOn,
            specifiedFormat
          )}`
        )
      })
    })

    describe('toLowerCase helper', () => {
      it('should format a string value to lower case', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Device {{toLowerCase device.name}} is offline`
        )
        assert.equal(
          message.payload,
          `Device ${messageDataSource.deviceName.toLowerCase()} is offline`
        )
      })
    })

    describe('mapValue helper', () => {
      it('should map the value to something in the value map provided', async () => {
        const valueMap = {
          ALTEST: 'A',
          BLTEST: 'B',
        }
        const message = await runProcessUsingDataSourceQuery(
          `External Facility Code for {{device.name}} is {{mapValue site.id valueMap='${JSON.stringify(
            valueMap
          )}'}}`
        )
        assert.equal(
          message.payload,
          `External Facility Code for ${messageDataSource.deviceName} is ${
            valueMap[messageDataSource.siteExternalId]
          }`
        )
      })

      it("should return nothing if the value map doesn't map it", async () => {
        const valueMap = {
          RANDOMVALUE: 'A',
          SOMEOTHERVALUE: 'B',
        }
        const message = await runProcessUsingDataSourceQuery(
          `External Facility Code for {{device.name}} is {{mapValue site.id valueMap='${JSON.stringify(
            valueMap
          )}'}}`
        )
        assert.equal(
          message.payload,
          `External Facility Code for ${messageDataSource.deviceName} is `
        )
      })
    })

    describe('defaultTo helper', () => {
      it('should return default value specified', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Device's pants Size is {{defaultTo device.pantsSize '4XL'}}`
        )
        assert.equal(message.payload, `Device's pants Size is 4XL`)
      })

      it('should allow more explicit declarations', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Device's pants Size is {{defaultTo device.pantsSize value='Medium'}}`
        )
        assert.equal(message.payload, `Device's pants Size is Medium`)
      })

      it('should still return nothing when default value is not specified', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Device's pants Size is {{defaultTo device.pantsSize}}`
        )
        assert.equal(message.payload, `Device's pants Size is `)
      })
    })

    describe('chaining helpers', () => {
      it("should pass the result of a helper to it's predecessor", async () => {
        const specifiedFormat = 'YYYY-MMMM-DD'
        const message = await runProcessUsingDataSourceQuery(
          `Offline since {{toLowerCase (formatDate device.lastSeenOn formatString='${specifiedFormat}')}}`
        )
        assert.equal(
          message.payload,
          `Offline since ${formatDateOrDefault(
            messageDataSource.deviceLastSeenOn,
            specifiedFormat
          ).toLowerCase()}`
        )
      })
    })
  })
})
