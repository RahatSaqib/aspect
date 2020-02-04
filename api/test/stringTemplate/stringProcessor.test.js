const _ = require('lodash')
const proxyquire = require('proxyquire')
const Promise = require('bluebird')
const { assert, expect } = require('chai')
const { convertToTimeZone } = require('date-fns-timezone')

const { runTest } = require('../utils/generatorFunctionUtils')
const {
  formatDateOrDefault,
  parseDateOrDefault,
} = require('../../src/shared/date')

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
          dateFormat: 'd/M/yyyy',
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
      dateFormat: 'd/M/yyyy',
      timeFormat: 'HH:mm:ss',
      dateTimeFormat: 'd/M/yyyy HH:mm:ss',
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
      siteShortName: 'Rahima Moosa RMMCH',
      deviceName: 'Rahima Moosa Mother and Child Hospital',
      deviceTypeExternalId: 'AlereQ',
      deviceLastSeenOn: new Date(2018, 7, 1, 10, 51, 13),
      resultStartedOn: new Date(2018, 7, 1, 10, 16, 28),
      resultEndedOn: new Date(2018, 7, 1, 10, 18, 1),
      resultNotes: 'These are the notes\nfor sample:\n   SAMPLE-123',
      sampleExternalId: 'SAMPLE-123',
      resultData: `{"id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","errorCode":"18006","timeStamp":"2018-10-05T13:40:46","hiv2Result":"---","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","hiv1OResult":"---","deviceSerial":"NAT-04000925","hiv1MNResult":"---","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
      resultFormData: `{"firstName":"James","surname":"Hetfield","musicalSkills":"","nameOfPatient":"Bryan","surnameOfPatient":"Richards","hospitalNumber":"HS97349","studyID":"ST976","ward":"66","timeSampleTaken":"2018-10-05T13:40:46","sampleType":"study","timeInstrumentResulted":"2018-10-05T14:51:18"}`,
      resultPatientData: `{"id":"ABC-123"}`,
      resultModuleName: null,
      resultModuleSerial: undefined,
      resultErrorCode: null,
      resultErrorNotes:
        'The result ended as\nan error. Why?\r\n   There are a number of reasons:\n1: # of tests\n2: & others such as 1+1=2',
      assayExternalId: 'assayAlereQHiv12Detect',
      resultCategory1ExternalId: 'Detected',
      resultCategory2ExternalId: 'NotDetected',
      createdOn: parseDateOrDefault('2018-08-01T10:38:00.000Z'),
      consumableSerial: '12345678',
      senderOperator: 'Dr Foster Went to Gloucestershire',
    }

    async function runProcessUsingDataSourceQuery(
      payloadTemplate,
      changesToMessageDataSource = {},
      templateFields = ['payloadTemplate']
    ) {
      const data = {
        ...messageDataSource,
        ...changesToMessageDataSource,
        payloadTemplate,
      }
      templateFields.forEach(field => {
        data[field] = payloadTemplate
      })
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
        const specifiedFormat = 'yyyy-MM-ddHH:mm'
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

    describe('offsetToTimeZone helper', () => {
      it('should change the date to use the offset of the timezone specified', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Offline since {{formatDate (offsetToTimeZone device.lastSeenOn timeZone='Pacific/Pitcairn') 'HH:mm'}}`
        )
        assert.notEqual(
          message.payload,
          `Offline since ${formatDateOrDefault(
            convertToTimeZone(messageDataSource.deviceLastSeenOn, {
              timeZone: 'America/Chicago',
            }),
            'HH:mm'
          )}`
        )
        assert.equal(
          message.payload,
          `Offline since ${formatDateOrDefault(
            convertToTimeZone(messageDataSource.deviceLastSeenOn, {
              timeZone: 'Pacific/Pitcairn',
            }),
            'HH:mm'
          )}`
        )
      })

      it('should accept timeZone as the default parameter', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Offline since {{formatDate (offsetToTimeZone device.lastSeenOn 'Pacific/Pitcairn') 'HH:mm'}}`
        )
        assert.notEqual(
          message.payload,
          `Offline since ${formatDateOrDefault(
            convertToTimeZone(messageDataSource.deviceLastSeenOn, {
              timeZone: 'America/Chicago',
            }),
            'HH:mm'
          )}`
        )
        assert.equal(
          message.payload,
          `Offline since ${formatDateOrDefault(
            convertToTimeZone(messageDataSource.deviceLastSeenOn, {
              timeZone: 'Pacific/Pitcairn',
            }),
            'HH:mm'
          )}`
        )
      })

      it('should evaluate to nothing if no data was provided', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Offline since {{formatDate (offsetToTimeZone device.thisDateDoesntExist timeZone='Pacific/Pitcairn') 'HH:mm'}}`
        )
        assert.equal(message.payload, `Offline since `)
      })

      it('should not change the date to use an offset if the timezone IS NOT specified', async () => {
        const specifiedFormat = 'yyyy-MM-ddHH:mm'
        const message = await runProcessUsingDataSourceQuery(
          `Offline since {{formatDate (offsetToTimeZone device.lastSeenOn) formatString='${specifiedFormat}'}}`
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
          KPTH: 'K',
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

    describe('customFieldValueFromLabel helper', () => {
      it('should return the value from the custom field using the label passed to it to identify which field', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Patient Case Number: {{customFieldValueFromLabel result.data.customFieldData 'TB Case No.(Patient ID)'}}`,
          {
            resultData: `{"customFieldData":{"1":{"label":"TB Case No.(Patient ID)","value":"TEST-P_CASE"},"2":{"label":"Name of Requesting Facility","value":"BOSTON Lab"}}}`,
          }
        )
        assert.equal(message.payload, 'Patient Case Number: TEST-P_CASE')
      })

      it("should return a blank string when the custom fields aren't there", async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Patient Case Number: {{customFieldValueFromLabel result.data.customFieldData 'TB Case No.(Patient ID)'}}`
        )
        assert.equal(message.payload, 'Patient Case Number: ')
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
          `Result error notes: ${encodeURIComponent(
            messageDataSource.resultErrorNotes
          )}`
        )
      })
    })

    describe('isRegexMatch helper', () => {
      it('should return true is the value matches the regex', async () => {
        const template = `{{#if (isRegexMatch result.data.hiv2Result expression='((< )?\\d+) cp\\/mL')}}Result has numeric value{{else}}Result does not have numeric value{{/if}}`
        let message = await runProcessUsingDataSourceQuery(template, {
          resultData: `{"hiv2Result":"< 800 cp/mL"}`,
        })
        assert.equal(message.payload, 'Result has numeric value')
        message = await runProcessUsingDataSourceQuery(template, {
          resultData: `{"hiv2Result":"Undetected"}`,
        })
        assert.equal(message.payload, 'Result does not have numeric value')
      })

      it('should provide falsey when expression is not defined', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `{{#if (isRegexMatch result.data.hiv2Result)}}Result has numeric value{{else}}Result does not have numeric value{{/if}}`,
          {
            resultData: `{"hiv2Result":"< 800 cp/mL"}`,
          }
        )
        assert.equal(message.payload, 'Result does not have numeric value')
      })

      it('should allow expression to be provided as the default option', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `{{#if (isRegexMatch result.data.hiv2Result '((< )?\\d+) cp\\/mL')}}Result has numeric value{{else}}Result does not have numeric value{{/if}}`,
          {
            resultData: `{"hiv2Result":"< 800 cp/mL"}`,
          }
        )
        assert.equal(message.payload, 'Result has numeric value')
      })

      it('should provide falsey when value is not defined', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `{{#if (isRegexMatch result.data.someUndefinedValue '((< )?\\d+) cp\\/mL')}}Result has numeric value{{else}}Result does not have numeric value{{/if}}`
        )
        assert.equal(message.payload, 'Result does not have numeric value')
      })
    })

    describe('extractValueFromRegexCaptureGroup helper', () => {
      it('should return the value in the matched group', async () => {
        let message = await runProcessUsingDataSourceQuery(
          `Result Numeric Value: {{extractValueFromRegexCaptureGroup result.data.hiv2Result expression='((< )?\\d+) cp\\/mL' groupNumber=1}}`,
          {
            resultData: `{"hiv2Result":"< 800 cp/mL"}`,
          }
        )
        assert.equal(message.payload, 'Result Numeric Value: < 800')
        message = await runProcessUsingDataSourceQuery(
          `Result Numeric Value: {{extractValueFromRegexCaptureGroup result.data.hiv2Result expression='((< )?\\d+) cp\\/mL' groupNumber=1}}`,
          {
            resultData: `{"hiv2Result":"2299 cp/mL"}`,
          }
        )
        assert.equal(message.payload, 'Result Numeric Value: 2299')
      })

      it('should default group number to 1', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Result Numeric Value: {{extractValueFromRegexCaptureGroup result.data.hiv2Result expression='((< )?\\d+) cp\\/mL'}}`,
          {
            resultData: `{"hiv2Result":"< 800 cp/mL"}`,
          }
        )
        assert.equal(message.payload, 'Result Numeric Value: < 800')
      })

      it('should provide nothing when expression is not defined', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Result Numeric Value: {{extractValueFromRegexCaptureGroup result.data.hiv2Result}}`,
          {
            resultData: `{"hiv2Result":"< 800 cp/mL"}`,
          }
        )
        assert.equal(message.payload, 'Result Numeric Value: ')
      })

      it('should allow expression to be provided as the default option', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Result Numeric Value: {{extractValueFromRegexCaptureGroup result.data.hiv2Result '((< )?\\d+) cp\\/mL'}}`,
          {
            resultData: `{"hiv2Result":"< 800 cp/mL"}`,
          }
        )
        assert.equal(message.payload, 'Result Numeric Value: < 800')
      })

      it('should provide nothing when value is not defined', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Result Numeric Value: {{extractValueFromRegexCaptureGroup result.data.someUndefinedValue '((< )?\\d+) cp\\/mL'}}`
        )
        assert.equal(message.payload, 'Result Numeric Value: ')
      })
    })

    describe('eq helper', () => {
      it('should branch in when values are equal', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `{{#if (eq result.data.hiv2Result '< 800 cp/mL')}}Values Are Equal{{else}}Values Are NOT Equal{{/if}}`,
          {
            resultData: `{"hiv2Result":"< 800 cp/mL"}`,
          }
        )
        assert.equal(message.payload, 'Values Are Equal')
      })

      it('should branch into else when values are not equal', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `{{#if (eq result.data.hiv2Result '< 800 cp/mL')}}Values Are Equal{{else}}Values Are NOT Equal{{/if}}`,
          {
            resultData: `{"hiv2Result":"Detected"}`,
          }
        )
        assert.equal(message.payload, 'Values Are NOT Equal')
      })
    })

    describe('toInt helper', () => {
      it('should parse the value as an integer thant can be compared to other numbers', async () => {
        let template = `{{#if (gt result.data.numericValue 8888)}}Numeric Value is greater than 8888{{else}}Numeric Value is NOT greater than 8888{{/if}}`
        let message = await runProcessUsingDataSourceQuery(template, {
          resultData: `{"numericValue":"10000"}`,
        })
        assert.equal(message.payload, `Numeric Value is greater than 8888`)
        message = await runProcessUsingDataSourceQuery(template, {
          resultData: `{"numericValue":"999"}`,
        })
        assert.equal(message.payload, `Numeric Value is NOT greater than 8888`)

        template = `{{#if (gt result.data.numericValue 8888.88)}}Numeric Value is greater than 8888.88{{else}}Numeric Value is NOT greater than 8888.88{{/if}}`
        message = await runProcessUsingDataSourceQuery(template, {
          resultData: `{"numericValue":"10000"}`,
        })
        assert.equal(message.payload, `Numeric Value is greater than 8888.88`)
        message = await runProcessUsingDataSourceQuery(template, {
          resultData: `{"numericValue":"999"}`,
        })
        assert.equal(
          message.payload,
          `Numeric Value is NOT greater than 8888.88`
        )
      })
    })

    describe('maxViralLoadValue helper', () => {
      it('should return the highest numeric value passed', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Viral Load: {{maxViralLoadValue result.data.numericValue1 result.data.numericValue2 result.data.numericValue3 result.data.numericValue4 result.data.numericValue4}}`,
          {
            resultData: `{"numericValue1":"10000 cp/mL","numericValue2":"Undetected","numericValue3":"< 10 000.13 cp/mL","numericValue4":"10 000.13 cp/mL","numericValue5":null}`,
          }
        )
        assert.equal(message.payload, `Viral Load: 10000.13`)
      })

      it('should return the nothing by default', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Viral Load: {{maxViralLoadValue result.data.numericValue1 result.data.numericValue2 result.data.numericValue3 result.data.numericValue4 result.data.numericValue4}}`,
          {
            resultData: `{"numericValue1":"Error","numericValue2":"Undetected","numericValue3":"NoResult","numericValue4":"","numericValue5":null}`,
          }
        )
        assert.equal(message.payload, `Viral Load: `)
      })
    })

    describe('chaining helpers', () => {
      it("should pass the result of a helper to it's predecessor", async () => {
        const specifiedFormat = 'yyyy-MMMM-dd'
        const message = await runProcessUsingDataSourceQuery(
          `Offline since {{urlEncode (enclose (toLowerCase (formatDate device.lastSeenOn formatString='${specifiedFormat}')) with='"')}}`
        )
        assert.equal(
          message.payload,
          `Offline since ${encodeURIComponent(
            `"${formatDateOrDefault(
              messageDataSource.deviceLastSeenOn,
              specifiedFormat
            ).toLowerCase()}"`
          )}`
        )
      })
    })

    describe('use cases for SA NHLS', () => {
      it('should process RedCAP API Payloads', async () => {
        const redCapDateTimeFormat = 'yyyy-MM-dd HH:mm'
        const johannesburgTimeZone = 'Africa/Johannesburg'
        const template =
          `token=1A234567B8C90D12345E6789F0G1234H&content=record&format=json&type=flat&overwriteBehavior=normal&forceAutoNumber=true&data=%5B%7B%22` +
          `record_id%22%3A%221%22%2C%20` +
          `%22redcap_data_access_group%22%3A{{urlEncode (enclose (toLowerCase (defaultTo site.id '')) with='"')}}%2C%20` +
          `%22first_name%22%3A{{urlEncode (enclose (defaultTo result.formData.nameOfPatient '') with='"')}}%2C%20` +
          `%22surname%22%3A{{urlEncode (enclose (defaultTo result.formData.surnameOfPatient '') with='"')}}%2C%20` +
          `%22hospital_number%22%3A{{urlEncode (enclose (defaultTo result.formData.hospitalNumber '') with='"')}}%2C%20` +
          `%22site_code%22%3A{{urlEncode (enclose (defaultTo (mapValue site.id '{"DNAH":"D","KPTH":"K","CMJAH":"J","RMMCH":"R","CHBAH":"B"}') '') with='"')}}%2C%20` +
          `%22ward_cubicle%22%3A{{urlEncode (enclose (defaultTo result.formData.ward '') with='"')}}%2C%20` +
          `%22sample_category%22%3A{{urlEncode (enclose (defaultTo result.formData.sampleType '') with='"')}}%2C%20` +
          `%22instrument_ca%22%3A{{urlEncode (enclose (defaultTo (mapValue device.deviceType '{"CepheidGeneXpert":"1","AlereQ":"2"}') '') with='"')}}%2C%20` +
          `%22assayhiv%22%3A{{urlEncode (enclose (defaultTo (mapValue result.assay.id '{"assayAlereQHiv12VLPlasma":"1","assayAlereQHiv12Detect":"2","GxHiv1Vl":"1","GxHiv1Qual":"2"}') '') with='"')}}%2C%20` +
          `%22sample_barcode%22%3A{{urlEncode (enclose (defaultTo result.sample.id '') with='"')}}%2C%20` +
          `%22sample_taken%22%3A{{urlEncode (enclose (defaultTo (formatDate (offsetToTimeZone result.formData.timeSampleTaken '${johannesburgTimeZone}') '${redCapDateTimeFormat}') '') with='"')}}%2C%20` +
          `%22point_of_care_instrument_r%22%3A{{urlEncode (enclose (defaultTo (mapValue (tryMergeResultCategories result.category1.id result.category2.id) '{"Detected":"1","MoreThan1000":"1","LessThan1000":"1","Trace Detected":"1","NotDetected":"2","NoResult":"3","Discordant":"3","Indeterminate":"3","Invalid":"3","Success":"3","CollectNewSample":"3","Rejected":"3","Missing":"3","Unknown":"3","Error":"4"}') '') with='"')}}%2C%20` +
          `%22error_code1%22%3A{{urlEncode (enclose (defaultTo result.errorCode '') with='"')}}%2C%20` +
          `%22poc_viral_load%22%3A` +
          `{{#if (eq result.assay.id 'assayAlereQHiv12VLPlasma')}}` +
          `{{#if (or (eq (tryMergeResultCategories result.category1.id result.category2.id) 'Error') ` +
          `(eq (tryMergeResultCategories result.category1.id result.category2.id) 'NoResult'))}}` +
          `{{urlEncode (enclose (tryMergeResultCategories result.category1.id result.category2.id) with='"')}}` +
          `{{else if (or (isRegexMatch result.data.hiv1MNResult '([\\d|\\s|\\.]+) cp\\/mL') ` +
          `(isRegexMatch result.data.hiv1OResult '([\\d|\\s|\\.]+) cp\\/mL') ` +
          `(isRegexMatch result.data.hiv2Result '([\\d|\\s|\\.]+) cp\\/mL'))}}` +
          `{{#if (or (gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv1MNResult '([\\d|\\s|\\.]+) cp\\/mL')) 10000000) ` +
          `(gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv1OResult '([\\d|\\s|\\.]+) cp\\/mL')) 10000000) ` +
          `(gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv2Result '([\\d|\\s|\\.]+) cp\\/mL')) 10000000))}}` +
          `%22%3E%2010%20000%20000%20copies%2Fml%22` +
          `{{else}}` +
          `%22{{urlEncode (defaultTo (maxViralLoadValue result.data.hiv1MNResult result.data.hiv1OResult result.data.hiv2Result) '0')}}%20copies%2Fml%22` +
          `{{/if}}` +
          `{{else}}` +
          `%220%22` +
          `{{/if}}` +
          `{{else if (eq result.assay.id 'GxHiv1Vl')}}` +
          `{{#if (or (eq (tryMergeResultCategories result.category1.id result.category2.id) 'Error') ` +
          `(eq (tryMergeResultCategories result.category1.id result.category2.id) 'NoResult'))}}` +
          `{{urlEncode (enclose (tryMergeResultCategories result.category1.id result.category2.id) with='"')}}` +
          `{{else if (gt (toInt (extractValueFromRegexCaptureGroup result.data.copies '([\\d|\\s|\\.]+)')) 10000000)}}` +
          `%22%3E%2010%20000%20000%20copies%2Fml%22` +
          `{{else}}` +
          `%22{{urlEncode (defaultTo (maxViralLoadValue result.data.copies) '0')}}%20copies%2Fml%22` +
          `{{/if}}` +
          `{{else}}` +
          `%22%22` +
          `{{/if}}` +
          `%2C%20` +
          `%22ct_value%22%3A{{urlEncode (enclose (defaultTo result.data.probes.probeCCt '0') with='"')}}%2C%20` +
          `%22result_instrument%22%3A{{urlEncode (enclose (defaultTo (formatDate (offsetToTimeZone result.formData.timeInstrumentResulted '${johannesburgTimeZone}') '${redCapDateTimeFormat}') '') with='"')}}` +
          `%7D%5D&returnContent=ids&returnFormat=json`
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
          KPTH: 'K',
          CMJAH: 'J',
          RMMCH: 'R',
          CHBAH: 'B',
        }
        const redCapResultCategoryCodes = {
          Detected: '1',
          MoreThan1000: '1',
          LessThan1000: '1',
          'Trace Detected': '1',
          NotDetected: '2',
          NoResult: '3',
          Discordant: '3',
          Indeterminate: '3',
          Invalid: '3',
          Success: '3',
          CollectNewSample: '3',
          Rejected: '3',
          Missing: '3',
          Unknown: '3',
          Error: '4',
        }
        const tryMergeResultCategories = (resultCategory1, resultCategory2) => {
          const priorityResult = (resultCategories, resultCategoryId) => {
            if (resultCategories.includes(resultCategoryId)) {
              return resultCategoryId
            }
          }
          const resultCategories = [resultCategory1, resultCategory2]
          const orderedPriorityCategories = [
            'Error',
            'Discordant',
            'Detected',
            'MoreThan1000',
            'LessThan1000',
            'Trace Detected',
            'NotDetected',
            'Invalid',
            'Indeterminate',
            'NoResult',
          ]
          for (let i = 0; i < orderedPriorityCategories.length; i++) {
            const foundPriorityCategory = priorityResult(
              resultCategories,
              orderedPriorityCategories[i]
            )
            if (foundPriorityCategory) {
              return foundPriorityCategory
            }
          }
          return resultCategory1 || resultCategory2
        }

        const useCases = [
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'Error',
            resultCategory2ExternalId: 'Error',
            expectedPocVl: '',
            expectedPocInstrumentR: '4',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"---","hiv1MNResult":"---","hiv2Result":"---","errorCode":"18006","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'NoResult',
            resultCategory2ExternalId: 'NoResult',
            expectedPocVl: '',
            expectedPocInstrumentR: '3',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"None","hiv1MNResult":"None","hiv2Result":"None","errorCode":"18006","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedPocVl: '',
            expectedPocInstrumentR: '1',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Detected","hiv1MNResult":"Undetected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedPocVl: '',
            expectedPocInstrumentR: '1',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Undetected","hiv1MNResult":"Detected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'NotDetected',
            resultCategory2ExternalId: 'Detected',
            expectedPocVl: '',
            expectedPocInstrumentR: '1',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Undetected","hiv1MNResult":"Undetected","hiv2Result":"Detected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'NotDetected',
            resultCategory2ExternalId: 'NotDetected',
            expectedPocVl: '',
            expectedPocInstrumentR: '2',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Undetected","hiv1MNResult":"Undetected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Error',
            resultCategory2ExternalId: 'Error',
            expectedPocVl: 'Error',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"---","hiv1MNResult":"---","hiv2Result":"---","errorCode":"18006","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'NoResult',
            resultCategory2ExternalId: 'NoResult',
            expectedPocVl: 'NoResult',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"None","hiv1MNResult":"None","hiv2Result":"None","errorCode":"18006","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedPocVl: '2299 copies/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"2299 cp/mL","hiv1MNResult":"Undetected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedPocVl: '2299 copies/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"< 800 cp/mL","hiv1MNResult":"2299 cp/mL","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedPocVl: '2299 copies/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Undetected","hiv1MNResult":"Undetected","hiv2Result":"2299 cp/mL","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedPocVl: '2299 copies/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"< 800 cp/mL","hiv1MNResult":"Undetected","hiv2Result":"2299 cp/mL","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedPocVl: '< 800 copies/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"< 800 cp/mL","hiv1MNResult":"Undetected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedPocVl: '> 10 000 000 copies/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"10000001 cp/mL","hiv1MNResult":"Undetected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'GxHiv1Qual',
            resultCategory1ExternalId: 'Error',
            resultCategory2ExternalId: 'Error',
            expectedPocVl: '',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{}`,
            resultDataErrorCode: '5000',
          },
          {
            assayExternalId: 'GxHiv1Qual',
            resultCategory1ExternalId: 'NoResult',
            resultCategory2ExternalId: 'NoResult',
            expectedPocVl: '',
            deviceTypeExternalId: 'CepheidGeneXpert',
          },
          {
            assayExternalId: 'GxHiv1Qual',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedPocVl: '',
            deviceTypeExternalId: 'CepheidGeneXpert',
          },
          {
            assayExternalId: 'GxHiv1Qual',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedPocVl: '',
            deviceTypeExternalId: 'CepheidGeneXpert',
          },
          {
            assayExternalId: 'GxHiv1Qual',
            resultCategory1ExternalId: 'NotDetected',
            resultCategory2ExternalId: 'Detected',
            expectedPocVl: '',
            deviceTypeExternalId: 'CepheidGeneXpert',
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Error',
            resultCategory2ExternalId: 'Error',
            expectedPocVl: 'Error',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultDataErrorCode: '7000',
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'NoResult',
            resultCategory2ExternalId: 'NoResult',
            expectedPocVl: 'NoResult',
            deviceTypeExternalId: 'CepheidGeneXpert',
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedPocVl: '2299 copies/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":2299}`,
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedPocVl: '< 800 copies/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":"< 800"}`,
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedPocVl: '2299 copies/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":"2299"}`,
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedPocVl: '< 800 copies/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":"< 800 cp/ml"}`,
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedPocVl: '> 10 000 000 copies/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":"10000001"}`,
          },
        ]
        await Promise.each(useCases, async useCase => {
          const dataSource = { ...messageDataSource, ...useCase }
          const formData = JSON.parse(dataSource.resultFormData)
          const message = await runProcessUsingDataSourceQuery(
            template,
            useCase
          )
          const resultData = JSON.parse(dataSource.resultData)
          assert.equal(
            message.payload,
            `token=1A234567B8C90D12345E6789F0G1234H&content=record&format=json&type=flat&overwriteBehavior=normal&forceAutoNumber=true&data=%5B%7B%22` +
              `record_id%22%3A%221%22%2C%20` +
              `%22redcap_data_access_group%22%3A%22${encodeURIComponent(
                dataSource.siteExternalId.toLowerCase()
              )}%22%2C%20` +
              `%22first_name%22%3A%22${encodeURIComponent(
                formData.nameOfPatient
              )}%22%2C%20` +
              `%22surname%22%3A%22${encodeURIComponent(
                formData.surnameOfPatient
              )}%22%2C%20` +
              `%22hospital_number%22%3A%22${encodeURIComponent(
                formData.hospitalNumber
              )}%22%2C%20` +
              `%22site_code%22%3A%22${
                redCapSiteCodes[dataSource.siteExternalId]
              }%22%2C%20` +
              `%22ward_cubicle%22%3A%22${encodeURIComponent(
                formData.ward
              )}%22%2C%20` +
              `%22sample_category%22%3A%22${encodeURIComponent(
                formData.sampleType
              )}%22%2C%20` +
              `%22instrument_ca%22%3A%22${
                redCapDeviceTypeCodes[dataSource.deviceTypeExternalId]
              }%22%2C%20` +
              `%22assayhiv%22%3A%22${
                redCapAssayCodes[dataSource.assayExternalId]
              }%22%2C%20` +
              `%22sample_barcode%22%3A%22${encodeURIComponent(
                dataSource.sampleExternalId
              )}%22%2C%20` +
              `%22sample_taken%22%3A%22${encodeURIComponent(
                formatDateOrDefault(
                  convertToTimeZone(formData.timeSampleTaken, {
                    timeZone: johannesburgTimeZone,
                  }),
                  redCapDateTimeFormat
                )
              )}%22%2C%20` +
              `%22point_of_care_instrument_r%22%3A%22${
                dataSource.expectedPocInstrumentR
                  ? dataSource.expectedPocInstrumentR
                  : redCapResultCategoryCodes[
                      tryMergeResultCategories(
                        dataSource.resultCategory1ExternalId,
                        dataSource.resultCategory2ExternalId
                      )
                    ]
              }%22%2C%20` +
              `%22error_code1%22%3A%22${encodeURIComponent(
                dataSource.resultErrorCode || ''
              )}%22%2C%20` +
              `%22poc_viral_load%22%3A%22${encodeURIComponent(
                dataSource.expectedPocVl
              )}%22%2C%20` +
              `%22ct_value%22%3A%22${_.get(resultData, [
                'probes',
                'probeCCT',
              ]) || '0'}%22%2C%20` +
              `%22result_instrument%22%3A%22${encodeURIComponent(
                formatDateOrDefault(
                  convertToTimeZone(formData.timeInstrumentResulted, {
                    timeZone: johannesburgTimeZone,
                  }),
                  redCapDateTimeFormat
                )
              )}%22` +
              `%7D%5D&returnContent=ids&returnFormat=json`,
            `Use case failed: ${JSON.stringify(useCase)}`
          )
          const jsonData = JSON.parse(
            decodeURIComponent(
              message.payload.substr(
                message.payload.indexOf('&data=') + '&data='.length,
                message.payload.indexOf('&returnContent=') -
                  message.payload.indexOf('&data=') -
                  '&data='.length
              )
            )
          )
          expect(jsonData)
            .to.be.an('array')
            .that.has.lengthOf(1)
            .and.containSubset([
              {
                record_id: '1',
                redcap_data_access_group: dataSource.siteExternalId.toLowerCase(),
                first_name: formData.nameOfPatient,
                surname: formData.surnameOfPatient,
                hospital_number: formData.hospitalNumber,
                site_code: redCapSiteCodes[dataSource.siteExternalId],
                ward_cubicle: formData.ward,
                sample_category: formData.sampleType,
                instrument_ca:
                  redCapDeviceTypeCodes[dataSource.deviceTypeExternalId],
                assayhiv: redCapAssayCodes[dataSource.assayExternalId],
                sample_barcode: dataSource.sampleExternalId,
                sample_taken: formatDateOrDefault(
                  convertToTimeZone(formData.timeSampleTaken, {
                    timeZone: johannesburgTimeZone,
                  }),
                  redCapDateTimeFormat
                ),
                point_of_care_instrument_r:
                  redCapResultCategoryCodes[
                    tryMergeResultCategories(
                      dataSource.resultCategory1ExternalId,
                      dataSource.resultCategory2ExternalId
                    )
                  ],
                error_code1: dataSource.resultErrorCode || '',
                poc_viral_load: dataSource.expectedPocVl,
                ct_value: _.get(resultData, ['probes', 'probeCCT']) || '0',
                result_instrument: formatDateOrDefault(
                  convertToTimeZone(formData.timeInstrumentResulted, {
                    timeZone: johannesburgTimeZone,
                  }),
                  redCapDateTimeFormat
                ),
              },
            ])
        })
      })

      it('should process SMS Payloads for New Results', async () => {
        const template =
          'New Result Uploaded {{result.sample.id}} from {{device.name}}. ' +
          'Please login to Aspect and enter additional details'
        const message = await runProcessUsingDataSourceQuery(
          template,
          messageDataSource
        )
        assert.equal(
          message.payload,
          `New Result Uploaded ${messageDataSource.sampleExternalId}` +
            ` from ${messageDataSource.deviceName}. ` +
            `Please login to Aspect and enter additional details`
        )
      })

      it('should process SMS Payloads for Results after result details have been filled out', async () => {
        const template =
          `GxAlert. New ` +
          `{{#if (or (eq result.assay.id 'assayAlereQHiv12VLPlasma') (eq result.assay.id 'GxHiv1Vl'))}}` +
          `case HIV > 50 cps ` +
          `{{else}}` +
          `EID HIV+ Case ` +
          `{{/if}}` +
          `from {{site.shortName}}; ` +
          `in Ward: {{result.formData.ward}}; Sample ID: {{result.sample.id}};  ` +
          `Patient ID: {{result.patient.id}} on {{formatDate result.endedOn}}` +
          `{{#if (eq result.assay.id 'assayAlereQHiv12VLPlasma')}}` +
          `{{#if (or (isRegexMatch result.data.hiv1MNResult '([\\d|\\s|\\.]+) cp\\/mL') ` +
          `(isRegexMatch result.data.hiv1OResult '([\\d|\\s|\\.]+) cp\\/mL') ` +
          `(isRegexMatch result.data.hiv2Result '([\\d|\\s|\\.]+) cp\\/mL'))}}` +
          `{{#if (or (gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv1MNResult '([\\d|\\s|\\.]+) cp\\/mL')) 10000000) ` +
          `(gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv1OResult '([\\d|\\s|\\.]+) cp\\/mL')) 10000000) ` +
          `(gt (toInt (extractValueFromRegexCaptureGroup result.data.hiv2Result '([\\d|\\s|\\.]+) cp\\/mL')) 10000000))}}` +
          `; Result: > 10 000 000 cp/ml` +
          `{{else}}` +
          `; Result: {{maxViralLoadValue result.data.hiv1MNResult result.data.hiv1OResult result.data.hiv2Result}} cp/ml` +
          `{{/if}}` +
          `{{/if}}` +
          `{{else if (eq result.assay.id 'GxHiv1Vl')}}` +
          `{{#if (gt (toInt (extractValueFromRegexCaptureGroup result.data.copies '([\\d|\\s|\\.]+)')) 10000000)}}` +
          `; Result: > 10 000 000 cp/ml` +
          `{{else}}` +
          `; Result: {{maxViralLoadValue result.data.copies}} cp/ml` +
          `{{/if}}` +
          `{{else}}` +
          `; Result: {{mapValue (tryMergeResultCategories result.category1.id result.category2.id) '{"Detected":"HIV+","NotDetected":"HIV-"}'}}` +
          `{{/if}}`

        const useCases = [
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedTitle: 'New EID HIV+ Case from',
            expectedResult: 'HIV+',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Detected","hiv1MNResult":"Undetected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedTitle: 'New EID HIV+ Case from',
            expectedResult: 'HIV+',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Undetected","hiv1MNResult":"Detected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'NotDetected',
            resultCategory2ExternalId: 'Detected',
            expectedTitle: 'New EID HIV+ Case from',
            expectedResult: 'HIV+',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Undetected","hiv1MNResult":"Undetected","hiv2Result":"Detected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedTitle: 'New case HIV > 50 cps from',
            expectedResult: '2299 cp/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"2299 cp/mL","hiv1MNResult":"Undetected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedTitle: 'New case HIV > 50 cps from',
            expectedResult: '2299 cp/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"< 800 cp/mL","hiv1MNResult":"2299 cp/mL","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedTitle: 'New case HIV > 50 cps from',
            expectedResult: '2299 cp/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Undetected","hiv1MNResult":"Undetected","hiv2Result":"2299 cp/mL","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedTitle: 'New case HIV > 50 cps from',
            expectedResult: '2299 cp/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"< 800 cp/mL","hiv1MNResult":"Undetected","hiv2Result":"2299 cp/mL","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedTitle: 'New case HIV > 50 cps from',
            expectedResult: '< 800 cp/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"< 800 cp/mL","hiv1MNResult":"Undetected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedTitle: 'New case HIV > 50 cps from',
            expectedResult: '> 10 000 000 cp/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"10000001 cp/mL","hiv1MNResult":"Undetected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'GxHiv1Qual',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedTitle: 'New EID HIV+ Case from',
            expectedResult: 'HIV+',
            deviceTypeExternalId: 'CepheidGeneXpert',
          },
          {
            assayExternalId: 'GxHiv1Qual',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedTitle: 'New EID HIV+ Case from',
            expectedResult: 'HIV+',
            deviceTypeExternalId: 'CepheidGeneXpert',
          },
          {
            assayExternalId: 'GxHiv1Qual',
            resultCategory1ExternalId: 'NotDetected',
            resultCategory2ExternalId: 'Detected',
            expectedTitle: 'New EID HIV+ Case from',
            expectedResult: 'HIV+',
            deviceTypeExternalId: 'CepheidGeneXpert',
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedTitle: 'New case HIV > 50 cps from',
            expectedResult: '2299 cp/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":2299}`,
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedTitle: 'New case HIV > 50 cps from',
            expectedResult: '< 800 cp/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":"< 800"}`,
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedTitle: 'New case HIV > 50 cps from',
            expectedResult: '2299 cp/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":"2299"}`,
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedTitle: 'New case HIV > 50 cps from',
            expectedResult: '< 800 cp/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":"< 800 cp/ml"}`,
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedTitle: 'New case HIV > 50 cps from',
            expectedResult: '> 10 000 000 cp/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":"10000001"}`,
          },
        ]
        await Promise.each(useCases, async useCase => {
          const dataSource = { ...messageDataSource, ...useCase }
          const formData = JSON.parse(dataSource.resultFormData)
          const message = await runProcessUsingDataSourceQuery(
            template,
            useCase
          )
          const patientData = JSON.parse(dataSource.resultPatientData)
          assert.equal(
            message.payload,
            `GxAlert. ${dataSource.expectedTitle} ${dataSource.siteShortName}; ` +
              `in Ward: ${formData.ward}; Sample ID: ${dataSource.sampleExternalId};  ` +
              `Patient ID: ${patientData.id} on ${formatDateOrDefault(
                dataSource.resultEndedOn,
                displayPreferences.dateFormat
              )}` +
              `; Result: ${dataSource.expectedResult}`,
            `Use case failed: ${JSON.stringify(useCase)}`
          )
        })
      })
    })

    describe('use cases for Cameroon', () => {
      it('should process Check TB App Payloads', async () => {
        const checkTbAppAuthKey = '00000-00000-00000-00000'
        const checkTbAppDateTimeFormat = 'yyyy-MM-dd HH:mm'
        const template =
          `{{curly true}}` +
          `"auth_key":"${checkTbAppAuthKey}",` +
          `"mtb_result":{{enclose (defaultTo (mapValue result.category1.id '{"Detected":"detected","Trace Detected":"trace","NotDetected":"not_detected","Indeterminate":"error_invalid","Invalid":"error_invalid","NoResult":"not_done","Error":"error_invalid","Negative":"not_detected","Positive1":"not_detected","Positive2":"detected","Positive3":"detected","PositiveMTB":"detected","Positive":"detected"}') '') with='"'}},` +
          `"mtb_grade":{{enclose (defaultTo (mapValue (extractValueFromRegexCaptureGroup result.data.resultText '(DETECTED HIGH|DÉTECTÉ ÉLEVÉ|DETECTED MEDIUM|DÉTECTÉ MOYEN|DETECTED LOW|DÉTECTÉ BAS|DETECTED VERY LOW|DÉTECTÉ TRÈS BAS)') '{"DETECTED HIGH":"high","DÉTECTÉ ÉLEVÉ":"high","DETECTED MEDIUM":"medium","DÉTECTÉ MOYEN":"medium","DETECTED LOW":"low","DÉTECTÉ BAS":"low","DETECTED VERY LOW":"very_low","DÉTECTÉ TRÈS BAS":"very_low"}') '') with='"'}},` +
          `{{#if (eq (defaultTo (mapValue result.category1.id '{"NotDetected":"mtbNotDetected","Negative":"mtbNotDetected"}') '') 'mtbNotDetected')}}` +
          `"rif_result":"not_detected",` +
          `{{else}}` +
          `"rif_result":{{enclose (defaultTo (mapValue result.category2.id '{"Detected":"detected","NotDetected":"not_detected","Indeterminate":"indeterminate","Susceptible":"not_detected","Resistant":"detected","Negative":"not_detected","Positive":"detected","Positive1":"detected","Positive2":"detected","Positive3":"detected"}') 'indeterminate') with='"'}},` +
          `{{/if}}` +
          `"test_date":{{enclose (defaultTo (formatDate (offsetToTimeZone result.createdOn 'Africa/Douala') '${checkTbAppDateTimeFormat}') '') with='"'}},` +
          `"deployment_full_name":{{enclose (defaultTo device.name '') with='"'}},` +
          `"cartridge_serial":{{enclose (defaultTo result.consumableSerial '') with='"'}},` +
          `"operator":{{enclose (defaultTo result.senderOperator '') with='"'}}` +
          `{{curly}}`
        const useCases = [
          {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'Error',
            resultCategory2ExternalId: 'Error',
            expectedMtbResult: 'error_invalid',
            expectedMtbGrade: '',
            expectedRifResult: 'indeterminate',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"ERROR"}`,
          },
          {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedMtbResult: 'detected',
            expectedMtbGrade: 'low',
            expectedRifResult: 'not_detected',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"DETECTED LOW|NOT DETECTED|"}`,
          },
          {
            assayExternalId: 'GxMtbRifUltra',
            resultCategory1ExternalId: 'Trace Detected',
            resultCategory2ExternalId: 'Indeterminate',
            expectedMtbResult: 'trace',
            expectedMtbGrade: '',
            expectedRifResult: 'indeterminate',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"MTB Trace DETECTED|RIF Resistance INDETERMINATE"}`,
          },
          {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'NotDetected',
            resultCategory2ExternalId: null,
            expectedMtbResult: 'not_detected',
            expectedMtbGrade: '',
            expectedRifResult: 'not_detected',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"MTB NOT DETECTED"}`,
          },
          {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedMtbResult: 'detected',
            expectedMtbGrade: 'medium',
            expectedRifResult: 'not_detected',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"MTB DÉTECTÉ MOYEN|Rif Resistance NON DÉTECTÉ"}`,
          },
          {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedMtbResult: 'detected',
            expectedMtbGrade: 'low',
            expectedRifResult: 'not_detected',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"MTB DÉTECTÉ BAS|Rif Resistance NON DÉTECTÉ"}`,
          },
          {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedMtbResult: 'detected',
            expectedMtbGrade: 'high',
            expectedRifResult: 'not_detected',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"MTB DÉTECTÉ ÉLEVÉ|Rif Resistance NON DÉTECTÉ"}`,
          },
          {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedMtbResult: 'detected',
            expectedMtbGrade: 'very_low',
            expectedRifResult: 'not_detected',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"MTB DÉTECTÉ TRÈS BAS|Rif Resistance INDÉTERMINÉ"}`,
          },
        ]
        await Promise.each(useCases, async useCase => {
          const dataSource = { ...messageDataSource, ...useCase }
          const message = await runProcessUsingDataSourceQuery(
            template,
            useCase
          )
          const messagePayload = JSON.parse(message.payload)
          expect(messagePayload).to.containSubset({
            auth_key: checkTbAppAuthKey,
            mtb_result: dataSource.expectedMtbResult,
            mtb_grade: dataSource.expectedMtbGrade,
            rif_result: dataSource.expectedRifResult,
            test_date: dataSource.expectedTestDate,
            deployment_full_name: dataSource.deviceName,
            cartridge_serial: dataSource.consumableSerial,
            operator: dataSource.senderOperator,
          })
        })
      })
    })

    describe('use cases for Philippines', () => {
      it('should process ITIS "REST API" urls', async () => {
        const philippinesITISSystemKey = 't3$+P@s5h!'
        const philippinesITISWebApiUrl =
          'http://itisdoh.pbsp.org.ph:3003/pushgxalert/'
        const philippinesITISDateTimeFormat = 'yyyy-MM-dd'
        const template =
          `${philippinesITISWebApiUrl}/${encodeURIComponent(
            philippinesITISSystemKey
          )}` +
          // TODO: Increase size of WebHookTemplate.url from VARCHAR(255) to TEXT
          // TODO: Ensure that TB Case No.(Patient ID) is mapped to patient.id whe result comes in from GxAlert
          `/CASE_NUMBER/{{urlEncode result.patient.id}}` +
          // TODO: Ensure that Specimen Code (Sample ID) is mapped to sample.id whe result comes in from GxAlert
          `/SPECIMEN_CODE/{{urlEncode (defaultTo result.sample.id 'NULL')}}` +
          // TODO: Seed ITIS facility list into Site table using hfacility.id as the externalId
          `/REQUESTING_FACILITY/{{urlEncode (defaultTo result.sample.originSite.id 'NULL')}}` +
          // TODO: Map GxAlert locations to sites loaded into the Aspect Site table with hfacility.id as the externalId
          `/LABORATORY/{{urlEncode (defaultTo site.id 'NULL')}}` +
          // TODO: Ensure that GxConnect custom fields are correctly mapped to the result patient data as in this template
          //       Date of Request -> patient.mrfDateRequested
          //       Name of Person Requesting Test -> patient.requestingPhysician
          //       Last Name of Patient -> patient.lastName
          //       First Name of Patient -> patient.firstName
          //       Middle Name of Patient -> patient.middleInitialOrName
          //       Age -> patient.age
          //       Patient Address -> patient.address
          //       Gender -> patient.sex
          //       Specimen Type -> sample.data.type... When Specimen Type from GxConnect comes in as 'Other' it should be saved as 'Others' inline with ITIS and PMDT options
          //       Repeat Collection? -> sample.data.repeatCollection
          //       Presumptive DS-TB/DR-TB -> patient.presumptiveDsOrDr
          //       Date Specimen Collected -> sample.collectedOn
          //       Visual Appearance -> sample.data.appearance
          //       Date of Release -> data.dateReleased
          //       Performed by -> data.examiner
          `/DATE_REQUESTED/{{defaultTo (formatDate result.patient.mrfDateRequested formatString='${philippinesITISDateTimeFormat}') 'NULL'}}` +
          `/REQUESTING_PHYSICIAN/{{urlEncode (defaultTo result.patient.requestingPhysician 'NULL')}}` +
          `/LAST_NAME/{{urlEncode (defaultTo result.patient.lastName 'NULL')}}` +
          `/FIRST_NAME/{{urlEncode (defaultTo result.patient.firstName 'NULL')}}` +
          `/MIDDLE_NAME/{{urlEncode (defaultTo result.patient.middleInitialOrName 'NULL')}}` +
          `/AGE/{{defaultTo result.patient.age 'NULL'}}` +
          `/STREET_ADDRESS/{{urlEncode (defaultTo result.patient.address 'NULL')}}` +
          // TODO: Find out if GEO_LOCATION refers to the location of the patient or the health facility. If it is the health facility, bring device.data into the device datasource and map geoLocationExternalId with each site
          `/GEO_LOCATION/NULL` +
          `/SEX/{{defaultTo (mapValue result.patient.sex '{"Male":"M","Female":"F"}') 'NULL'}}` +
          // Patient contact details currently come from GxConnect custom fields and are not entered in the NTRL database
          // The NTRL team would like to add these fields to the MRF in the Access Database
          `/MOBILE_NUMBER/{{urlEncode (defaultTo (customFieldValueFromLabel result.data.customFieldData 'Patient Phone') 'NULL')}}` +
          `/LANDLINE/{{urlEncode (defaultTo (customFieldValueFromLabel result.data.customFieldData 'Patient\\'s Landline No.') 'NULL')}}` +
          `/EMAIL/{{urlEncode (defaultTo (customFieldValueFromLabel result.data.customFieldData 'Patient\\'s Email Address') 'NULL')}}` +
          // Reason for Examination options in:
          //     NTRL/PMDT database: Treatment Schedule: DIAGNOSIS, BAS, Follow up, Post Treatment
          //     GxConnect: Repeat Test: 0 - First or second, 1 - Follow-up, 2 - Repeat Baseline
          //     Unused GxConnect Field: Reason for Examination:
          //       - 938492: DIAGNOSIS
          //       - 938493: BASELINE
          //       - 938494: BEFORE TREATMENT
          //       - 938495: 2ND WEEK
          //       - 938496: 1ST MONTH
          //       - 938497: 2ND MONTH
          //       - 938498: 3RD MONTH
          //       - 938499: 4TH MONTH
          //       - 938500: 5TH MONTH
          //       - 938501: 6TH MONTH
          //       - 938502: 7TH MONTH
          //       - 938503: 8TH MONTH
          //       - 938504: 9TH MONTH
          //       - 938505: 10TH MONTH
          //       - 938506: 11TH MONTH
          //       - 938507: 12TH MONTH
          //       - 938508: 13TH MONTH
          //       - 938509: 14TH MONTH
          //       - 938510: 15TH MONTH
          //       - 938511: 16TH MONTH
          //       - 938512: 17TH MONTH
          //       - 938513: 18TH MONTH
          //       - 938514: 19TH MONTH
          //       - 938515: 20TH MONTH
          //       - 938516: 21ST MONTH
          //       - 938517: 22ND MONTH
          //       - 938518: 23RD MONTH
          //       - 938519: 24TH MONTH
          //       - 938520: 25TH MONTH
          //       - 938521: 26TH MONTH
          //       - 938522: 27TH MONTH
          //       - 938523: 28TH MONTH
          //       - 938524: 29TH MONTH
          //       - 938525: 30TH MONTH
          //       - 938526: 31ST MONTH
          //       - 938558: 32ND MONTH
          //       - 938559: 33RD MONTH
          //       - 938560: 34TH MONTH
          //       - 938561: 35TH MONTH
          //       - 938562: 36TH MONTH
          //       - 938563: 1ST POST FOLLOW-UP
          //       - 938564: 2ND POST FOLLOW-UP
          //       - 938565: 3RD POST FOLLOW-UP
          //       - 938566: 4TH POST FOLLOW-UP
          //       - 938677: 37TH MONTH
          //       - 938730: 38TH MONTH
          //       - 938731: 39TH MONTH
          //       - 938732: 40TH MONTH
          // ITIS Data Dictionary:
          //       - 938492: DIAGNOSIS
          //       - 938493: BASELINE
          //       - 938494: BEFORE TREATMENT
          //       - 938495: 2ND WEEK
          //       - 938496: 1ST MONTH
          //       - 938497: 2ND MONTH
          //       - 938498: 3RD MONTH
          //       - 938499: 4TH MONTH
          //       - 938500: 5TH MONTH
          //       - 938501: 6TH MONTH
          //       - 938502: 7TH MONTH
          //       - 938503: 8TH MONTH
          //       - 938504: 9TH MONTH
          //       - 938505: 10TH MONTH
          //       - 938506: 11TH MONTH
          //       - 938507: 12TH MONTH
          //       - 938508: 13TH MONTH
          //       - 938509: 14TH MONTH
          //       - 938510: 15TH MONTH
          //       - 938511: 16TH MONTH
          //       - 938512: 17TH MONTH
          //       - 938513: 18TH MONTH
          //       - 938514: 19TH MONTH
          //       - 938515: 20TH MONTH
          //       - 938516: 21ST MONTH
          //       - 938517: 22ND MONTH
          //       - 938518: 23RD MONTH
          //       - 938519: 24TH MONTH
          //       - 938520: 25TH MONTH
          //       - 938521: 26TH MONTH
          //       - 938522: 27TH MONTH
          //       - 938523: 28TH MONTH
          //       - 938524: 29TH MONTH
          //       - 938525: 30TH MONTH
          //       - 938526: 31ST MONTH
          //       - 938558: 32ND MONTH
          //       - 938559: 33RD MONTH
          //       - 938560: 34TH MONTH
          //       - 938561: 35TH MONTH
          //       - 938562: 36TH MONTH
          //       - 938563: 1ST POST FOLLOW-UP
          //       - 938564: 2ND POST FOLLOW-UP
          //       - 938565: 3RD POST FOLLOW-UP
          //       - 938566: 4TH POST FOLLOW-UP
          //       - 938677: 37TH MONTH
          //       - 938730: 38TH MONTH
          //       - 938731: 39TH MONTH
          //       - 938732: 40TH MONTH
          // TODO: Map RepeatTest from GxConnect to patient.treatmentSchedule
          // TODO: Find out how to map patient.treatmentSchedule to REASON_FOR_EXAMINATION
          `/REASON_FOR_EXAMINATION/NULL` +
          // PMDT Database Registration Group Options
          // TODO: Interpret these in patient.registrationGroup as the text that they should be in ITIS (ie: TAF should be saved as TX AFTER FAILURE)
          //  - RELAPSE
          //  - TAF
          //  - TALF
          //  - PTOU
          //  - OTHER
          // TODO: Find out what how  interpret CAT II options
          //  - CAT II RELAPSE
          //  - CAT II FAILURE
          //  - New
          // GxConnect Unused Registration Group Options
          //  - 938610: NEW
          //  - 938611: RELAPSE
          //  - 938613: TX AFTER LOST TO FF-UP
          //  - 938614: TX AFTER FAILURE
          //  - 938615: PREVIOUS TX OUTCOME UNKNOWN
          //  - 938616: OTHER
          // ITIS Data Dictionary
          //  - 938610 = NEW
          //  - 938611 = RELAPSE
          //  - 938613 = TX AFTER LOST TO FF-UP
          //  - 938614 = TX AFTER FAILURE
          //  - 938615 = PREVIOUS TX OUTCOME UNKNOWN
          //  - 938616 = OTHER
          `/REGISTRATION_GROUP/{{defaultTo (mapValue result.patient.registrationGroup '{"NEW":"938610","RELAPSE":"938611","TX AFTER LOST TO FF-UP":"938613","TX AFTER FAILURE":"938614","PREVIOUS TX OUTCOME UNKNOWN":"938615","OTHER":"938616"}') 'NULL'}}` +
          // TODO: Add JSON data field to the sample table and bring them into the base datasource for string template processing.
          //       For TB sputum specimens, the data could include type, repeatCollection, appearance & volume keys which are common
          `/SPECIMEN_TYPE/{{defaultTo (mapValue result.sample.data.type '{"Sputum":"0","Isolates":"1","Others":"1"}') 'NULL'}}` +
          `/REPEAT_COLLECTION/{{defaultTo (mapValue result.sample.data.repeatCollection '{"Yes":"1","No":"0"}') 'NULL'}}` +
          // GxConnect Options:
          //   - Presumptive DS-TB
          //   - Presumptive DR-TB
          // PMDT Options:
          //   - Presumptive DR-TB
          //   - Presumptive DS-TB
          `/PRESUMPTIVE_DSDR_TB/{{defaultTo (mapValue result.patient.presumptiveDsOrDr '{"Presumptive DS-TB":"0","Presumptive DR-TB":"1"}') 'NULL'}}` +
          `/SPECIMEN_COLLECTION_DATE/{{defaultTo (formatDate result.sample.collectedOn formatString='${philippinesITISDateTimeFormat}') 'NULL'}}` +
          `/VISUAL_APPEARANCE/{{defaultTo (mapValue result.sample.data.appearance '{"Muco-purulent":"938638","Blood-stained":"938639","Salivary":"938640","Mucosalivary":"938672","Purulent":"938891"}') 'NULL'}}` +
          `/RESULT_MTB/{{defaultTo (mapValue result.category1.id '{"NotDetected":"0","Detected":"1","Trace Detected":"1","Indeterminate":"2","Invalid":"2","Error":"2","NoResult":"2"}') 'NULL'}}` +
          `/RESULT_RIF/{{defaultTo (mapValue result.category2.id '{"NotDetected":"0","Detected":"1","Invalid":"4","Error":"4","NoResult":"6","Indeterminate":"7"}') 'NULL'}}` +
          `/RELEASE_DATE/{{defaultTo (formatDate result.data.dateReleased formatString='${philippinesITISDateTimeFormat}') 'NULL'}}` +
          `/PERFORMED_BY/{{urlEncode (defaultTo result.data.examiner 'NULL')}}`
        const useCases = [
          {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'Error',
            resultCategory2ExternalId: 'Error',
            expectedMtbResult: 'error_invalid',
            expectedMtbGrade: '',
            expectedRifResult: 'indeterminate',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"ERROR"}`,
          },
          {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedMtbResult: 'detected',
            expectedMtbGrade: 'low',
            expectedRifResult: 'not_detected',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"DETECTED LOW|NOT DETECTED|"}`,
          },
          {
            assayExternalId: 'GxMtbRifUltra',
            resultCategory1ExternalId: 'Trace Detected',
            resultCategory2ExternalId: 'Indeterminate',
            expectedMtbResult: 'trace',
            expectedMtbGrade: '',
            expectedRifResult: 'indeterminate',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"MTB Trace DETECTED|RIF Resistance INDETERMINATE"}`,
          },
          {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'NotDetected',
            resultCategory2ExternalId: null,
            expectedMtbResult: 'not_detected',
            expectedMtbGrade: '',
            expectedRifResult: 'not_detected',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"MTB NOT DETECTED"}`,
          },
          {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedMtbResult: 'detected',
            expectedMtbGrade: 'medium',
            expectedRifResult: 'not_detected',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"MTB DÉTECTÉ MOYEN|Rif Resistance NON DÉTECTÉ"}`,
          },
          {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedMtbResult: 'detected',
            expectedMtbGrade: 'low',
            expectedRifResult: 'not_detected',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"MTB DÉTECTÉ BAS|Rif Resistance NON DÉTECTÉ"}`,
          },
          {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedMtbResult: 'detected',
            expectedMtbGrade: 'high',
            expectedRifResult: 'not_detected',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"MTB DÉTECTÉ ÉLEVÉ|Rif Resistance NON DÉTECTÉ"}`,
          },
          {
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedMtbResult: 'detected',
            expectedMtbGrade: 'very_low',
            expectedRifResult: 'not_detected',
            expectedTestDate: '2018-08-01 11:38',
            expectedCartridgeSerial: messageDataSource.consumableSerial,
            expectedOperator: messageDataSource.senderOperator,
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"resultText":"MTB DÉTECTÉ TRÈS BAS|Rif Resistance INDÉTERMINÉ"}`,
          },
        ]
        await Promise.each(useCases, async useCase => {
          const dataSource = { ...messageDataSource, ...useCase }
          const resultData = dataSource.resultData
            ? JSON.parse(dataSource.resultData)
            : {}
          const resultPatientData = dataSource.resultPatientData
            ? JSON.parse(dataSource.resultPatientData)
            : {}
          const resultSample = {
            id: dataSource.sampleExternalId,
            originSite: {
              id: dataSource.sampleOriginSiteId,
            },
            collectedOn: dataSource.sampleCollectedOn,
            data: dataSource.sampleData
              ? JSON.parse(dataSource.sampleData)
              : {},
          }
          const site = {
            id: dataSource.siteExternalId,
            name: dataSource.siteName,
            shortName: dataSource.siteShortName,
          }
          const message = await runProcessUsingDataSourceQuery(
            template,
            useCase,
            ['urlTemplate']
          )
          expect(message.url).to.equal(
            `${philippinesITISWebApiUrl}/${encodeURIComponent(
              philippinesITISSystemKey
            )}` +
              `/CASE_NUMBER/${encodeURIComponent(
                resultPatientData.id || 'NULL'
              )}` +
              `/SPECIMEN_CODE/${encodeURIComponent(
                resultSample.id || 'NULL'
              )}` +
              `/REQUESTING_FACILITY/${encodeURIComponent(
                resultSample.originSite.id || 'NULL'
              )}` +
              `/LABORATORY/${encodeURIComponent(site.id || 'NULL')}` +
              `/DATE_REQUESTED/${formatDateOrDefault(
                parseDateOrDefault(resultPatientData.mrfDateRequested, {
                  defaultDate: null,
                }),
                philippinesITISDateTimeFormat
              ) || 'NULL'}` +
              `/REQUESTING_PHYSICIAN/${encodeURIComponent(
                resultPatientData.requestingPhysician || 'NULL'
              )}` +
              `/LAST_NAME/${encodeURIComponent(
                resultPatientData.lastName || 'NULL'
              )}` +
              `/FIRST_NAME/${encodeURIComponent(
                resultPatientData.firstName || 'NULL'
              )}` +
              `/MIDDLE_NAME/${encodeURIComponent(
                resultPatientData.middleInitialOrName || 'NULL'
              )}` +
              `/AGE/${resultPatientData.age || 'NULL'}` +
              `/STREET_ADDRESS/${encodeURIComponent(
                resultPatientData.address || 'NULL'
              )}` +
              `/GEO_LOCATION/NULL` +
              `/SEX/${{ Male: 'M', Female: 'F' }[resultPatientData.sex] ||
                'NULL'}` +
              `/MOBILE_NUMBER/${encodeURIComponent(
                (
                  (resultData.customFieldData || []).find(
                    customField => customField.label === 'Patient Phone'
                  ) || {}
                ).value || 'NULL'
              )}` +
              `/LANDLINE/${encodeURIComponent(
                (
                  (resultData.customFieldData || []).find(
                    customField =>
                      customField.label === "Patient's Landline No."
                  ) || {}
                ).value || 'NULL'
              )}` +
              `/EMAIL/${encodeURIComponent(
                (
                  (resultData.customFieldData || []).find(
                    customField =>
                      customField.label === "Patient's Email Address"
                  ) || {}
                ).value || 'NULL'
              )}` +
              `/REASON_FOR_EXAMINATION/NULL` +
              `/REGISTRATION_GROUP/${{
                NEW: '938610',
                RELAPSE: '938611',
                'TX AFTER LOST TO FF-UP': '938613',
                'TX AFTER FAILURE': '938614',
                'PREVIOUS TX OUTCOME UNKNOWN': '938615',
                OTHER: '938616',
              }[resultPatientData.registrationGroup] || 'NULL'}` +
              `/SPECIMEN_TYPE/${{ Sputum: '0', Isolates: '1', Others: '1' }[
                resultSample.data.type
              ] || 'NULL'}` +
              `/REPEAT_COLLECTION/${{ Yes: '1', No: '0' }[
                resultSample.data.repeatCollection
              ] || 'NULL'}` +
              `/PRESUMPTIVE_DSDR_TB/${{
                'Presumptive DS-TB': '0',
                'Presumptive DR-TB': '1',
              }[resultPatientData.presumptiveDsOrDr] || 'NULL'}` +
              `/SPECIMEN_COLLECTION_DATE/${formatDateOrDefault(
                parseDateOrDefault(resultSample.collectedOn, {
                  defaultDate: null,
                }),
                philippinesITISDateTimeFormat
              ) || 'NULL'}` +
              `/VISUAL_APPEARANCE/${{
                'Muco-purulent': '938638',
                'Blood-stained': '938639',
                Salivary: '938640',
                Mucosalivary: '938672',
                Purulent: '938891',
              }[resultSample.data.appearance] || 'NULL'}` +
              `/RESULT_MTB/${{
                NotDetected: '0',
                Detected: '1',
                'Trace Detected': '1',
                Indeterminate: '2',
                Invalid: '2',
                Error: '2',
                NoResult: '2',
              }[dataSource.resultCategory1ExternalId] || 'NULL'}` +
              `/RESULT_RIF/${{
                NotDetected: '0',
                Detected: '1',
                Invalid: '4',
                Error: '4',
                NoResult: '6',
                Indeterminate: '7',
              }[dataSource.resultCategory2ExternalId] || 'NULL'}` +
              `/RELEASE_DATE/${formatDateOrDefault(
                parseDateOrDefault(resultData.dateReleased, {
                  defaultDate: null,
                }),
                philippinesITISDateTimeFormat
              ) || 'NULL'}` +
              `/PERFORMED_BY/${encodeURIComponent(
                resultData.examiner || 'NULL'
              )}`
          )
        })
      })
    })
  })
})
