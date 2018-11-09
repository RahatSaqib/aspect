const _ = require('lodash')
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
      siteExternalId: 'RMMCH',
      deviceName: 'Rahima Moosa Mother and Child Hospital',
      deviceTypeExternalId: 'AlereQ',
      deviceLastSeenOn: new Date(2018, 7, 1, 10, 51, 13),
      resultStartedOn: new Date(2018, 7, 1, 10, 16, 28),
      resultEndedOn: new Date(2018, 7, 1, 10, 18, 1),
      resultNotes: 'These are the notes\nfor sample:\n   SAMPLE-123',
      sampleExternalId: 'SAMPLE-123',
      resultData: `{"id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","errorCode":"18006","timeStamp":"2018-10-05T13:40:46","hiv2Result":"---","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","hiv1OResult":"---","deviceSerial":"NAT-04000925","hiv1MNResult":"---","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
      resultFormData: `{"firstName":"James","surname":"Hetfield","musicalSkills":"","nameOfPatient":"Bryan","surnameOfPatient":"Richards","hospitalNumber":"HS97349","studyID":"ST976","ward":"66","timeSampleTaken":"2018-10-05T13:40:46","sampleType":"study","timeInstrumentResulted":"2018-10-05T14:51:18"}`,
      resultModuleName: null,
      resultModuleSerial: undefined,
      resultErrorCode: null,
      resultErrorNotes:
        'The result ended as\nan error. Why?\r\n   There are a number of reasons:\n1: # of tests\n2: & others such as 1+1=2',
      assayExternalId: 'assayAlereQHiv12Detect',
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
          DNAH: 'D',
          kalafong: 'K',
          CMJAH: 'J',
          RMMCH: 'R',
          CHBAH: 'B',
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

    describe('enclose helper', () => {
      it('should return the value enclosed in the characters specified', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Device's name is {{enclose device.name '"'}}`
        )
        assert.equal(
          message.payload,
          `Device's name is "${messageDataSource.deviceName}"`
        )
      })

      it('should allow more explicit declarations', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Device's name is {{enclose device.name with='"'}}`
        )
        assert.equal(
          message.payload,
          `Device's name is "${messageDataSource.deviceName}"`
        )
      })

      it('should return the original value string when value is nil', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Device's pants Size is {{enclose device.pantsSize '"'}}`
        )
        assert.equal(message.payload, `Device's pants Size is `)
      })

      it('should enclose a blank string when it is passed', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `{{result.formData.firstName}} {{result.formData.surname}} Musical Skills: {{enclose result.formData.musicalSkills '"'}}`
        )
        assert.equal(
          message.payload,
          `${JSON.parse(messageDataSource.resultFormData).firstName} ${
            JSON.parse(messageDataSource.resultFormData).surname
          } Musical Skills: ""`
        )
      })
    })

    describe('escapeLines helper', () => {
      it('should escape line breaks and trim each line', async () => {
        const message = await runProcessUsingDataSourceQuery(
          'RESULT NOTES: {{escapeLines result.notes}}'
        )
        assert.equal(
          message.payload,
          `RESULT NOTES: ${_.map(
            messageDataSource.resultNotes.split('\n'),
            line => line.trim()
          ).join('\\n')}`
        )
      })

      it('should do nothing when the value is nothing', async () => {
        let message = await runProcessUsingDataSourceQuery(
          'Result module serial is {{escapeLines result.moduleSerial}}'
        )
        assert.equal(message.payload, 'Result module serial is ')
        message = await runProcessUsingDataSourceQuery(
          'Result module name is {{escapeLines result.moduleName}}'
        )
        assert.equal(message.payload, 'Result module name is ')
      })

      it('should do nothing when the value contains no line breaks', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Device's name is {{escapeLines device.name}}`
        )
        assert.equal(
          message.payload,
          `Device's name is ${messageDataSource.deviceName}`
        )
      })
    })

    describe('urlEncode helper', () => {
      it('should return the URL encoded value', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Result error notes: {{urlEncode result.errorNotes}}`
        )
        assert.equal(
          message.payload,
          `Result error notes: ${encodeURI(messageDataSource.resultErrorNotes)}`
        )
      })
    })

    describe('chaining helpers', () => {
      it("should pass the result of a helper to it's predecessor", async () => {
        const specifiedFormat = 'YYYY-MMMM-DD'
        const message = await runProcessUsingDataSourceQuery(
          `Offline since {{urlEncode (enclose (toLowerCase (formatDate device.lastSeenOn formatString='${specifiedFormat}')) with='"')}}`
        )
        assert.equal(
          message.payload,
          `Offline since ${encodeURI(
            `"${formatDateOrDefault(
              messageDataSource.deviceLastSeenOn,
              specifiedFormat
            ).toLowerCase()}"`
          )}`
        )
      })

      describe('use case for SA NHLS', () => {
        it('should process RedCAP API Payloads', async () => {
          const redCapDateTimeFormat = 'YYYY-MM-DD HH:mm'
          const message = await runProcessUsingDataSourceQuery(
            `token=1A234567B8C90D12345E6789F0G1234H&content=record&format=json&type=flat&overwriteBehavior=normal&forceAutoNumber=true&data=%5B%7B%22` +
              `record_id%22%3A%221%22%2C+` +
              `%22redcap_data_access_group%22%3A{{urlEncode (enclose (toLowerCase (defaultTo site.id '')) with='"')}}%2C+` +
              `%22first_name%22%3A{{urlEncode (enclose (defaultTo result.formData.nameOfPatient '') with='"')}}%2C+` +
              `%22surname%22%3A{{urlEncode (enclose (defaultTo result.formData.surnameOfPatient '') with='"')}}%2C+` +
              `%22hospital_number%22%3A{{urlEncode (enclose (defaultTo result.formData.hospitalNumber '') with='"')}}%2C+` +
              `%22site_code%22%3A{{urlEncode (enclose (defaultTo (mapValue site.id '{"DNAH":"D","kalafong":"K","CMJAH":"J","RMMCH":"R","CHBAH":"B"}') '') with='"')}}%2C+` +
              `%22ward_cubicle%22%3A{{urlEncode (enclose (defaultTo result.formData.ward '') with='"')}}%2C+` +
              `%22sample_category%22%3A{{urlEncode (enclose (defaultTo result.formData.sampleType '') with='"')}}%2C+` +
              `%22instrument_ca%22%3A{{urlEncode (enclose (defaultTo (mapValue device.deviceType '{"CepheidGeneXpert":"1","AlereQ":"2"}') '') with='"')}}%2C+` +
              `%22assayhiv%22%3A{{urlEncode (enclose (defaultTo (mapValue result.assay.id '{"assayAlereQHiv12VLPlasma":"1","assayAlereQHiv12Detect":"2","GxHiv1Vl":"1","GxHiv1Qual":"2"}') '') with='"')}}%2C+` +
              `%22sample_barcode%22%3A{{urlEncode (enclose (defaultTo result.sample.id '') with='"')}}%2C+` +
              `%22sample_taken%22%3A{{urlEncode (enclose (defaultTo (formatDate result.formData.timeSampleTaken '${redCapDateTimeFormat}') '') with='"')}}%2C+` +
              `%22point_of_care_instrument_r%22%3A[Result1|filters:{"Positive":"1","Negative":"2","No Result":"3","Invalid":"3","Error":"4"}>double_quote>url_encode|default:%22%22]%2C+` +
              `%22error_code1%22%3A{{urlEncode (enclose (defaultTo result.errorCode '') with='"')}}%2C+` +
              `%22poc_viral_load%22%3A%22%22%2C+` +
              `%22ct_value%22%3A%220%22%2C+` +
              `%22result_instrument%22%3A{{urlEncode (enclose (defaultTo (formatDate result.endedOn '${redCapDateTimeFormat}') '') with='"')}}` +
              `%7D%5D&returnContent=ids&returnFormat=json`
          )
          const formData = JSON.parse(messageDataSource.resultFormData)
          const redCapDeviceTypeCodes = {
            CepheidGeneXpert: '1',
            AlereQ: '2',
          }
          const redCapAssayCodes = {
            assayAlereQHiv12VLPlasma: '1',
            assayAlereQHiv12Detect: '2',
            GxHiv1Vl: '1',
            GxHiv1Qual: '2',
          }
          const redCapSiteCodes = {
            DNAH: 'D',
            kalafong: 'K',
            CMJAH: 'J',
            RMMCH: 'R',
            CHBAH: 'B',
          }
          assert.equal(
            message.payload,
            `token=1A234567B8C90D12345E6789F0G1234H&content=record&format=json&type=flat&overwriteBehavior=normal&forceAutoNumber=true&data=%5B%7B%22` +
              `record_id%22%3A%221%22%2C+` +
              `%22redcap_data_access_group%22%3A%22${encodeURI(
                messageDataSource.siteExternalId.toLowerCase()
              )}%22%2C+` +
              `%22first_name%22%3A%22${encodeURI(
                formData.nameOfPatient
              )}%22%2C+` +
              `%22surname%22%3A%22${encodeURI(
                formData.surnameOfPatient
              )}%22%2C+` +
              `%22hospital_number%22%3A%22${encodeURI(
                formData.hospitalNumber
              )}%22%2C+` +
              `%22site_code%22%3A%22${
                redCapSiteCodes[messageDataSource.siteExternalId]
              }%22%2C+` +
              `%22ward_cubicle%22%3A%22${encodeURI(formData.ward)}%22%2C+` +
              `%22sample_category%22%3A%22${encodeURI(
                formData.sampleType
              )}%22%2C+` +
              `%22instrument_ca%22%3A%22${
                redCapDeviceTypeCodes[messageDataSource.deviceTypeExternalId]
              }%22%2C+` +
              `%22assayhiv%22%3A%22${
                redCapAssayCodes[messageDataSource.assayExternalId]
              }%22%2C+` +
              `%22sample_barcode%22%3A%22${encodeURI(
                messageDataSource.sampleExternalId
              )}%22%2C+` +
              `%22sample_taken%22%3A%22${encodeURI(
                formatDateOrDefault(
                  formData.timeSampleTaken,
                  redCapDateTimeFormat
                )
              )}%22%2C+` +
              `%22point_of_care_instrument_r%22%3A[Result1|filters:{"Positive":"1","Negative":"2","No Result":"3","Invalid":"3","Error":"4"}>double_quote>url_encode|default:%22%22]%2C+` +
              `%22error_code1%22%3A%22${encodeURI(
                messageDataSource.resultErrorCode || ''
              )}%22%2C+` +
              `%22poc_viral_load%22%3A%22%22%2C+` +
              `%22ct_value%22%3A%220%22%2C+` +
              `%22result_instrument%22%3A%22${encodeURI(
                formatDateOrDefault(
                  messageDataSource.resultEndedOn,
                  redCapDateTimeFormat
                )
              )}%22` +
              `%7D%5D&returnContent=ids&returnFormat=json`
          )
        })
      })
    })
  })
})
