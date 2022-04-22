/* eslint-disable max-len */
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

    const patientExternalId = 'PATIENT-SYS123655'
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
      resultRawData: `H|\\^&|||m2000^8.0.25.0^275021695^H1P1O1R1C1L1|||||||P|1|20190825165312
P|1|${patientExternalId}|
O|1|SYS123655|SYS123655^vl110^H12|^^^1mLDBSvOP^HIV1.0mlDBS|||||||||||||||||||||F
R|1|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^F|Not detected|Copies / mL||OPEN||F||bryan^bryan||20190825165311|275021695
R|2|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^I|Target not detected|||||F||bryan^bryan||20190825165311|275021695
R|3|^^^1mLDBSvOP^HIV1.0mlDBS^466746^11176551^^P|-1.00|cycle number||||F||bryan^bryan||20190825165311|275021695
L|1`,
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

      it('should match on start and end of line markers', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `{{extractValueFromRegexCaptureGroup result.rawData expression='^P\\|\\d*\\|([^\\|;]+)\\|' groupNumber=1}}`
        )
        assert.equal(message.payload, patientExternalId)
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

    describe('coalesce helper', () => {
      it('should return the first value that is not falsy', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Patient Case Number: {{coalesce result.data.undefinedCaseNumber result.data.caseNumberOne result.data.caseNumberTwo result.data.caseNumberThree result.data.caseNumberFour result.data.caseNumberFive result.data.caseNumberSix}}`,
          {
            resultData: JSON.stringify({
              caseNumberOne: 0,
              caseNumberTwo: '',
              caseNumberThree: false,
              caseNumberFour: 'truth',
              caseNumberFive: 1,
              caseNumberSix: true,
            }),
          }
        )
        assert.equal(message.payload, `Patient Case Number: truth`)
      })

      it('should return a blank string when none of the supplied values are truthy', async () => {
        const message = await runProcessUsingDataSourceQuery(
          `Patient Case Number: {{coalesce result.data.undefinedCaseNumber result.data.caseNumberOne result.data.caseNumberTwo result.data.caseNumberThree}}`,
          {
            resultData: JSON.stringify({
              caseNumberOne: 0,
              caseNumberTwo: '',
              caseNumberThree: false,
            }),
          }
        )
        assert.equal(message.payload, `Patient Case Number: `)
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
              `%22ct_value%22%3A%22${
                _.get(resultData, ['probes', 'probeCCT']) || '0'
              }%22%2C%20` +
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
                redcap_data_access_group:
                  dataSource.siteExternalId.toLowerCase(),
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
        const philippinesITISWebApiUrl =
          'http://itis.doh.gov.ph:3005/pushtbexam'
        const genderValueMap = { Male: 'M', Female: 'F' }
        const postTreatmentReasonForExaminationCodes = {
          1: '938563',
          2: '938564',
          3: '938565',
          4: '938566',
        }
        const monthOfTreatmentReasonForExaminationCodes = {
          1: '938496',
          2: '938497',
          3: '938498',
          4: '938499',
          5: '938500',
          6: '938501',
          7: '938502',
          8: '938503',
          9: '938504',
          10: '938505',
          11: '938506',
          12: '938507',
          13: '938508',
          14: '938509',
          15: '938510',
          16: '938511',
          17: '938512',
          18: '938513',
          19: '938514',
          20: '938515',
          21: '938516',
          22: '938517',
          23: '938518',
          24: '938519',
          25: '938520',
          26: '938521',
          27: '938522',
          28: '938523',
          29: '938524',
          30: '938525',
          31: '938526',
          32: '938558',
          33: '938559',
          34: '938560',
          35: '938561',
          36: '938562',
          37: '938677',
          38: '938730',
          39: '938731',
          40: '938732',
        }
        const registrationGroupCodes = {
          New: '938610',
          NEW: '938610',
          RELAPSE: '938611',
          TALF: '938613',
          'TX AFTER LOST TO FF-UP': '938613',
          'TX AFTER FAILURE': '938614',
          TAF: '938614',
          PTOU: '938615',
          'PREVIOUS TX OUTCOME UNKNOWN': '938615',
          OTHER: '938616',
        }
        const specimenTypeCodes = { Sputum: '0', Isolates: '1', Others: '1' }
        const repeatCollectionCodes = { Yes: '1', No: '0' }
        const presumptiveTbDsDrCodes = {
          'Presumptive DS-TB': '0',
          'Presumptive DR-TB': '1',
        }
        const visualAppearanceCodes = {
          'Muco-purulent': '938638',
          'Blood-stained': '938639',
          Salivary: '938640',
          Mucosalivary: '938672',
          Purulent: '938891',
        }
        const examTypes = {
          assaySmear: 'DSSM',
          GxMtbRif: 'XPERT_MTBRIF',
          GxMtbRifUltra: 'XPERT_MTBRIF',
          assayTbLamp: 'TB_LAMP',
          assayGenericCulture: 'CULTURE',
          assayBdMgitGnd: 'CULTURE',
          assayBdMgitAst: 'DST',
          assayGenericDst: 'DST',
          assayLPA: 'LPA',
        }
        const smearResultCodeMappings = {
          NotDetected: '0',
          Positive1: '2',
          Positive2: '3',
          Positive3: '4',
          Missing: '6',
        }
        const xpertResultCodeMappings = {
          NotDetected: '0',
          Detected: '1',
          'Trace Detected': '1',
          Indeterminate: '2',
          Invalid: '2',
          NoResult: '2',
          Error: '2',
        }
        const xpertRifResultCodeMappings = {
          Detected: '1',
          Error: '4',
          Indeterminate: '7',
        }
        const tbLampResultCodeMappings = { Negative: '0', Positive: '1' }
        const cultureResultCodeMappings = {
          NotDetected: '0',
          Detected: '1',
          PositiveMTB: '1',
          PositiveMOTT: '2',
          Contaminated: '3',
          Missing: '4',
          Unknown: '4',
        }
        const mgitSireStatusToEncodedMappings = {
          R: 'RESISTANT',
          S: 'SUSCEPTIBLE',
        }
        const dstResultCodeMappings = {
          'NOT DONE': 'ND',
          'NON VIABLE': 'ND',
          RESISTANT: '1',
          SUSCEPTIBLE: '2',
          CONTAMINATED: '4',
        }
        const lpaMtbResultCodeMappings = {
          NotDetected: '0',
          PositiveMTB: '1',
          Invalid: '2',
        }
        const lpaHighLowResistanceCodeMappings = {
          'Resistance not detected': '0',
          'Low-level resistance detected': '1',
          'High-level resistance detected': '2',
        }
        const lpaResistanceCodeMappings = {
          'Resistance Not Detected': '0',
          'Resistance Detected': '1',
        }
        const itisDateFormat = 'yyyy-MM-dd'
        const template =
          `${philippinesITISWebApiUrl}/gX%40leR%2B%21Ti%24` +
          `/TB_CASE_NUMBER/{{urlEncode (defaultTo (coalesce result.patient.tbCaseNumber result.patient.id) 'NULL')}}` +
          `/SPECIMEN_CODE/{{urlEncode (defaultTo result.sample.id 'NULL')}}` +
          `/REQUESTING_FACILITY/{{urlEncode (defaultTo (coalesce result.sample.originSite.id result.patient.referringHealthFacility) 'NULL')}}` +
          // TODO: Ensure that GxConnect custom field values are correctly sanitized & mapped to the result patient data as in this template
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
          //       Repeat Test -> patient.treatmentSchedule
          `/DATE_OF_REQUEST/{{urlEncode (defaultTo (formatDate result.patient.mrfDateRequested formatString='${itisDateFormat}') 'NULL')}}` +
          `/FACILITY_CONTACT/{{urlEncode (defaultTo result.patient.facilityContactNumber 'NULL')}}` +
          `/REQUESTING_PHYSICIAN/{{urlEncode (defaultTo result.patient.requestingPhysician 'NULL')}}` +
          `/PATIENT_LAST_NAME/{{urlEncode (defaultTo result.patient.lastName 'NULL')}}` +
          `/PATIENT_FIRST_NAME/{{urlEncode (defaultTo result.patient.firstName 'NULL')}}` +
          `/PATIENT_MIDDLE_NAME/{{urlEncode (defaultTo result.patient.middleInitialOrName 'NULL')}}` +
          `/PATIENT_AGE/{{defaultTo (extractValueFromRegexCaptureGroup result.patient.age expression='^(\\d*)(.*)$' groupNumber=1) 'NULL'}}` +
          `/PATIENT_ADDRESS/{{urlEncode (defaultTo result.patient.address 'NULL')}}` +
          `/SEX/{{defaultTo (mapValue result.patient.sex '${JSON.stringify(
            genderValueMap
          )}') 'NULL'}}` +
          `/PATIENT_MOBILE_NUMBER/{{urlEncode (defaultTo (coalesce result.patient.phone (customFieldValueFromLabel result.data.customFieldData 'Patient Phone')) 'NULL')}}` +
          `/PATIENT_LANDLINE_NUMBER/{{urlEncode (defaultTo (customFieldValueFromLabel result.data.customFieldData 'Patient\\'s Landline No.') 'NULL')}}` +
          `/PATIENT_EMAIL/{{urlEncode (defaultTo (customFieldValueFromLabel result.data.customFieldData 'Patient\\'s Email Address') 'NULL')}}` +
          // Reason for Examination options in:
          //     NTRL/PMDT database: Treatment Schedule: DIAGNOSIS, BAS, Follow up, Post Treatment
          //     GxConnect: Repeat Test: 0 - First or second, 1 - Follow-up, 2 - Repeat Baseline
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
          // From GxConnect custom fields use patient.treatmentSchedule
          //    - patient.treatmentSchedule = 'DIAGNOSIS'
          //        - Send DIAGNOSIS
          //    - patient.treatmentSchedule = 'BASELINE'
          //        - Send BASELINE
          //      TODO: Sanitize GxConnect custom field payload with 'Follow-up' and standardize on 'Follow up'
          //    - patient.treatmentSchedule = 'Follow up'
          //        - Send NULL. This is different from when result comes from PMDT database because we are not assuming that the follow up is on the 2ND WEEK
          // From PMDT database use patient.treatmentSchedule and patient.monthOfTreatment
          //    - patient.treatmentSchedule = 'DIAGNOSIS'
          //        - Send DIAGNOSIS
          //      TODO: Sanitize PMDT payload with 'BAS' or 'BASE LINE' and standardize on 'BASELINE'
          //    - patient.treatmentSchedule = 'BAS' or 'BASELINE' or 'BASE LINE'
          //        - Send BASELINE
          //      TODO: Sanitize PMDT payload with 'Follow-up' and standardize on 'Follow up'
          //    - patient.treatmentSchedule = 'Follow up' use patient.monthOfTreatment to determine option:
          //        - Blank = 2ND WEEK
          //        - 1, 2, 3... = 1ST MONTH, 2ND MONTH, 3RD MONTH...
          //        - PT1, PT2, 2ND POST TX... = 1ST POST FOLLOW-UP, 2ND POST FOLLOW-UP...
          //    - patient.treatmentSchedule = 'Post Treatment' use patient.monthOfTreatment to determine option:
          //        - 1, 2, 3... = 1ST POST FOLLOW-UP, 2ND POST FOLLOW-UP, 3RD POST FOLLOW-UP...
          `/REASON_FOR_EXAMINATION/` +
          `{{#if (eq (toLowerCase (defaultTo (extractValueFromRegexCaptureGroup result.patient.monthOfTreatment expression='^(PT)\\d*' groupNumber=1) '')) 'pt')}}` +
          `{{defaultTo (mapValue (extractValueFromRegexCaptureGroup result.patient.monthOfTreatment expression='^PT(\\d*)' groupNumber=1) '${JSON.stringify(
            postTreatmentReasonForExaminationCodes
          )}') 'NULL'}}` +
          `{{else if (isRegexMatch (toLowerCase (defaultTo result.patient.treatmentSchedule '')) 'diagnosis')}}` +
          `938492` +
          `{{else if (or (isRegexMatch (toLowerCase (defaultTo result.patient.treatmentSchedule '')) 'bas') (isRegexMatch (toLowerCase (defaultTo result.patient.treatmentSchedule '')) 'baseline'))}}` +
          `938493` +
          `{{else}}` +
          `{{defaultTo (mapValue (extractValueFromRegexCaptureGroup result.patient.monthOfTreatment expression='(\\d*)' groupNumber=1) '${JSON.stringify(
            monthOfTreatmentReasonForExaminationCodes
          )}') 'NULL'}}` +
          `{{/if}}` +
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
          `/REGISTRATION_GROUP/{{urlEncode (defaultTo (mapValue result.patient.registrationGroup '${JSON.stringify(
            registrationGroupCodes
          )}') '938616')}}` +
          // TODO: Add JSON data field to the sample table and bring them into the base datasource for string template processing.
          //       For TB sputum specimens, the data could include type, repeatCollection, appearance & volume keys which are common
          `/SPECIMEN_TYPE/{{defaultTo (mapValue result.sample.data.type '${JSON.stringify(
            specimenTypeCodes
          )}') 'NULL'}}` +
          `/REPEAT_COLLECTION/{{defaultTo (mapValue result.sample.data.repeatCollection '${JSON.stringify(
            repeatCollectionCodes
          )}') 'NULL'}}` +
          // GxConnect Options:
          //   - Presumptive DS-TB
          //   - Presumptive DR-TB
          // PMDT Options:
          //   - Presumptive DR-TB
          //   - Presumptive DS-TB
          `/PRESUMPTIVE_TB_DSDR/{{defaultTo (mapValue result.patient.presumptiveDsOrDr '${JSON.stringify(
            presumptiveTbDsDrCodes
          )}') 'NULL'}}` +
          `/DATE_SPECIMEN_COLLECTED/{{defaultTo (formatDate result.sample.collectedOn formatString='${itisDateFormat}') 'NULL'}}` +
          `/VISUAL_APPEARANCE/{{defaultTo (mapValue result.sample.data.appearance '${JSON.stringify(
            visualAppearanceCodes
          )}') 'NULL'}}` +
          `/EXAM_TYPE/{{defaultTo (mapValue result.assay.id '${JSON.stringify(
            examTypes
          )}') 'NULL'}}` +
          `/EXAM_RESULT/` +
          `{{#if (eq result.assay.id 'assaySmear')}}` +
          `%7B%22RESULT%22%3A%22{{defaultTo (mapValue result.category1.id '${JSON.stringify(
            smearResultCodeMappings
          )}') '6'}}%22%2C%22NUM_AFB%22%3A%22N%2FA%22%7D` +
          `{{else if (or (eq result.assay.id 'GxMtbRif') (eq result.assay.id 'GxMtbRifUltra'))}}` +
          `%7B%22MTB%22%3A%22{{defaultTo (mapValue result.category1.id '${JSON.stringify(
            xpertResultCodeMappings
          )}') '3'}}%22%2C%22RIF%22%3A%22{{defaultTo (mapValue result.category2.id '${JSON.stringify(
            xpertRifResultCodeMappings
          )}') '6'}}%22%7D` +
          `{{else if (and (eq result.assay.id 'assayTbLamp') (or (eq result.category1.id 'Negative') (eq result.category1.id 'Positive')))}}` +
          `%7B%22RESULT%22%3A%22{{defaultTo (mapValue result.category1.id '${JSON.stringify(
            tbLampResultCodeMappings
          )}') '3'}}%22%7D` +
          `{{else if (and (or (eq result.assay.id 'assayBdMgitGnd') (eq result.assay.id 'assayGenericCulture')) (or (eq result.category1.id 'Detected') (eq result.category1.id 'NotDetected') (eq result.category1.id 'Missing') (eq result.category1.id 'Unknown') (eq result.category1.id 'Contaminated') (eq result.category1.id 'PositiveMOTT') (eq result.category1.id 'PositiveMTB')))}}` +
          `%7B%22RESULT%22%3A%22{{defaultTo (mapValue result.category1.id '${JSON.stringify(
            cultureResultCodeMappings
          )}') '4'}}%22%7D` +
          `{{else if (and (or (eq result.assay.id 'assayBdMgitAst') (eq result.assay.id 'assayGenericDst')) (or (eq result.category1.id 'Detected') (eq result.category1.id 'PositiveMTB')) (or (eq result.category2.id 'Resistant') (eq result.category2.id 'Susceptible') (eq result.category2.id 'Contaminated')))}}` +
          `%7B%22H%22%3A%22{{defaultTo (mapValue (coalesce result.data.encodedResult.isoniazid (defaultTo (mapValue result.data.INH.sirStatus '${JSON.stringify(
            mgitSireStatusToEncodedMappings
          )}') 'NOT DONE')) '${JSON.stringify(
            dstResultCodeMappings
          )}') 'ND'}}%22%2C%22R%22%3A%22{{defaultTo (mapValue (coalesce result.data.encodedResult.rifampicin (defaultTo (mapValue result.data.RIF.sirStatus '${JSON.stringify(
            mgitSireStatusToEncodedMappings
          )}') 'NOT DONE')) '${JSON.stringify(
            dstResultCodeMappings
          )}') 'ND'}}%22%2C%22Z%22%3A%22{{defaultTo (mapValue result.data.encodedResult.pyrazinamide '${JSON.stringify(
            dstResultCodeMappings
          )}') 'ND'}}%22%2C%22E%22%3A%22{{defaultTo (mapValue (coalesce result.data.encodedResult.ethambutol (defaultTo (mapValue result.data.EMB.sirStatus '${JSON.stringify(
            mgitSireStatusToEncodedMappings
          )}') 'NOT DONE')) '${JSON.stringify(
            dstResultCodeMappings
          )}') 'ND'}}%22%2C%22S%22%3A%22{{defaultTo (mapValue (coalesce result.data.encodedResult.streptomycin (defaultTo (mapValue result.data.S.sirStatus '${JSON.stringify(
            mgitSireStatusToEncodedMappings
          )}') 'NOT DONE')) '${JSON.stringify(
            dstResultCodeMappings
          )}') 'ND'}}%22%2C%22Km%22%3A%22{{defaultTo (mapValue result.data.encodedResult.kanamycin '${JSON.stringify(
            dstResultCodeMappings
          )}') 'ND'}}%22%2C%22Cm%22%3A%22{{defaultTo (mapValue result.data.encodedResult.capreomycin '${JSON.stringify(
            dstResultCodeMappings
          )}') 'ND'}}%22%2C%22Ofx%22%3A%22{{defaultTo (mapValue result.data.encodedResult.ofloxacin '${JSON.stringify(
            dstResultCodeMappings
          )}') 'ND'}}%22%2C%22Lfx%22%3A%22{{defaultTo (mapValue result.data.encodedResult.levofloxacin '${JSON.stringify(
            dstResultCodeMappings
          )}') 'ND'}}%22%2C%22Cs%22%3A%22ND%22%2C%22Am%22%3A%22{{defaultTo (mapValue result.data.encodedResult.amikacin '${JSON.stringify(
            dstResultCodeMappings
          )}') 'ND'}}%22%7D` +
          `{{else if (and (eq result.assay.id 'assayLPA') (or (eq result.category1.id 'NotDetected') (eq result.category1.id 'Invalid') (eq result.category1.id 'PositiveMTB')))}}` +
          `%7B%22MTB%22%3A%22{{mapValue result.category1.id '${JSON.stringify(
            lpaMtbResultCodeMappings
          )}'}}%22%2C%22H%22%3A%22{{defaultTo (mapValue result.data.encodedResult.isoniazid '${JSON.stringify(
            lpaHighLowResistanceCodeMappings
          )}') '3'}}%22%2C%22R%22%3A%22{{defaultTo (mapValue result.data.encodedResult.rifampicin '${JSON.stringify(
            lpaResistanceCodeMappings
          )}') '3'}}%22%2C%22FQ%22%3A%22{{defaultTo (mapValue result.data.encodedResult.fluoroquinolones '${JSON.stringify(
            lpaResistanceCodeMappings
          )}') '3'}}%22%2C%22SLI%22%3A%22{{defaultTo (mapValue result.data.encodedResult.aminoglycoside '${JSON.stringify(
            lpaResistanceCodeMappings
          )}') '3'}}%22%7D` +
          `{{else}}` +
          `NULL` +
          `{{/if}}` +
          `/DATE_OF_RELEASE/{{defaultTo (formatDate result.data.encodedResult.dateReleased formatString='${itisDateFormat}') 'NULL'}}` +
          `/PERFORMED_BY/{{urlEncode (defaultTo (coalesce result.data.encodedResult.examiner result.data.encodedResult.labTech result.senderOperator) 'NULL')}}`
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
            site: {
              id: 'NTRL1',
              name: 'National TB Reference Laboratory',
              shortName: 'NTRL',
            },
            assayExternalId: 'GxMtbRif',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            resultPatientData: JSON.stringify({
              id: 'P-11234-239',
              mrfDateRequested: '2018-08-01 11:38',
              requestingPhysician: 'Dr Gobetz',
              lastName: 'Betman',
              firstName: 'Joan',
              middleInitialOrName: 'M',
              age: 26,
              address: '27A, 16th Street, Hatley, Pleasantville, GB66682',
              sex: 'Female',
              serialNumber: '123321',
              treatmentSchedule: 'DIAGNOSIS',
              monthOfTreatment: '',
              registrationGroup: 'NEW',
              presumptiveDsOrDr: 'Presumptive DS-TB',
            }),
            sampleExternalId: 'P-11234-239-1',
            sampleOriginSiteExternalId: 'SITE1234',
            sampleCollectedOn: null,
            sampleData: JSON.stringify({
              type: 'Sputum',
              repeatCollection: 'Yes',
              appearance: 'Muco-purulent',
            }),
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: JSON.stringify({
              customFieldData: [
                {
                  label: 'Patient Phone',
                  value: '011-678-1234',
                },
                {
                  label: "Patient's Landline No.",
                  value: '8488-765-1212',
                },
                {
                  label: "Patient's Email Address",
                  value: 'patient@test.com',
                },
              ],
              encodedResult: {
                dateReleased: '2018-08-01 11:38',
                examiner: 'James Jenson',
              },
            }),
          },
          {
            site: {
              id: 'REMOTE1',
              name: 'Satellite Treatment Center',
              shortName: 'STC',
            },
            assayExternalId: 'GxMtbRifUltra',
            resultCategory1ExternalId: 'Trace Detected',
            resultCategory2ExternalId: 'Indeterminate',
            resultPatientData: JSON.stringify({
              id: 'P-293874-292',
              mrfDateRequested: '2018-06-03 08:13',
              lastName: 'Mulller',
              age: '6 Months',
              address: 'Greater Horwich',
              sex: 'Male',
              serialNumber: '92382',
              treatmentSchedule: 'BASELINE',
              monthOfTreatment: '6 Months',
              registrationGroup: 'RELAPSE',
              presumptiveDsOrDr: 'Presumptive DR-TB',
            }),
            sampleExternalId: 'P-293874-292-1',
            sampleOriginSiteExternalId: 'SITE111',
            sampleCollectedOn: null,
            sampleData: JSON.stringify({
              type: 'Others',
              repeatCollection: 'No',
              appearance: 'Blood-stained',
            }),
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: JSON.stringify({
              customFieldData: [],
              encodedResult: {
                dateReleased: '2018-06-03 08:13',
                examiner: 'James Jenson',
              },
            }),
          },
          {
            site: {
              id: 'REMOTE2',
              name: 'Satellite Treatment Center',
              shortName: 'STC2',
            },
            assayExternalId: 'GxMtbRifUltra',
            resultCategory1ExternalId: 'Trace Detected',
            resultCategory2ExternalId: 'Indeterminate',
            resultPatientData: JSON.stringify({
              id: 'P-123422-111',
              mrfDateRequested: '1970-12-16 19:55',
              lastName: 'Schwartz',
              firstName: 'Elmarie',
              age: '22 Years',
              address: '1 Beckton Avenue, Mulspoort, California, USA',
              serialNumber: '92382',
              treatmentSchedule: 'Follow up',
              monthOfTreatment: '34',
              registrationGroup: 'TX AFTER LOST TO FF-UP',
              presumptiveDsOrDr: 'Presumptive DR-TB',
            }),
            sampleExternalId: 'P-123422-111',
            sampleOriginSiteExternalId: 'SITE5',
            sampleCollectedOn: '1970-12-16',
            sampleData: JSON.stringify({
              type: 'Isolates',
            }),
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: JSON.stringify({
              customFieldData: [
                {
                  label: "Patient's Email Address",
                  value: 'isolate@history.geocities.com',
                },
              ],
              encodedResult: {
                dateReleased: '2018-06-03 08:13',
                examiner: 'Bill Visagie',
              },
            }),
          },
          {
            site: {
              id: 'REMOTE2',
              name: 'Satellite Treatment Center',
              shortName: 'STC2',
            },
            assayExternalId: 'assaySmear',
            resultCategory1ExternalId: 'Positive1',
            resultPatientData: JSON.stringify({
              id: 'P-123422-111',
              mrfDateRequested: '1999-12-31 23:59',
              lastName: 'Swanepoel',
              firstName: 'Baksteen',
              middleInitialOrName: 'PJHHA',
              age: '22 Years',
              address: '1 Beckton Avenue, Mulspoort, California, USA',
              serialNumber: '92382',
              treatmentSchedule: 'Follow up',
              monthOfTreatment: 'PT2',
              registrationGroup: 'PTOU',
              presumptiveDsOrDr: 'Presumptive DR-TB',
              referringHealthFacility: 'Boeties Lekker Clinic',
              facilityContactNumber: '555-123-1234',
              requestingPhysician: 'Dr Boetie van der Merwe',
              sex: 'Male',
              phone: '+27833243688',
            }),
            sampleExternalId: 'P-123422-111',
            sampleCollectedOn: '1970-12-16',
            sampleData: JSON.stringify({
              type: 'Isolates',
            }),
            deviceTypeExternalId: 'PhilippinesNtrl',
            resultData: JSON.stringify({
              customFieldData: [
                {
                  label: "Patient's Email Address",
                  value: 'isolate@history.geocities.com',
                },
              ],
              encodedResult: {
                dateReleased: '2018-06-03 08:13',
                labTech: 'Jemima Puddleduck',
              },
            }),
          },
          {
            site: {
              id: 'REMOTE2',
              name: 'Satellite Treatment Center',
              shortName: 'STC2',
            },
            assayExternalId: 'assayTbLamp',
            resultCategory1ExternalId: 'Positive',
            resultPatientData: JSON.stringify({
              id: 'P-123-111',
              mrfDateRequested: '2010-1-11 1:01',
              monthOfTreatment: '1st month',
              registrationGroup: 'New',
              presumptiveDsOrDr: 'Presumptive DS-TB',
              referringHealthFacility: 'REMOTE2',
              facilityContactNumber: '123-123-1234',
              requestingPhysician: 'Dr Dr',
              sex: 'Female',
              phone: '0987654321',
            }),
            sampleExternalId: 'P-123-111',
            sampleCollectedOn: '2222-11-30',
            deviceTypeExternalId: 'PhilippinesNtrl',
            resultData: JSON.stringify({
              encodedResult: {
                dateReleased: '2018-07-04 18:21',
              },
            }),
          },
          {
            site: {
              id: 'NTRL',
              name: 'NTRL',
              shortName: 'NTRL',
            },
            assayExternalId: 'assayGenericCulture',
            resultCategory1ExternalId: 'PositiveMOTT',
            resultPatientData: JSON.stringify({
              mrfDateRequested: '2022-2-22 2:22',
              monthOfTreatment: '2nd month',
              registrationGroup: 'New',
              presumptiveDsOrDr: 'Presumptive DS-TB',
              referringHealthFacility: 'RITM',
            }),
            sampleExternalId: 'P-CULTURE-MOTT',
            deviceTypeExternalId: 'PhilippinesNtrl',
          },
          {
            site: {
              id: 'NTRL',
              name: 'NTRL',
              shortName: 'NTRL',
            },
            assayExternalId: 'assayBdMgitAst',
            resultCategory1ExternalId: 'PositiveMTB',
            resultCategory2ExternalId: 'Resistant',
            resultPatientData: JSON.stringify({
              mrfDateRequested: '2022-2-22 2:22',
              monthOfTreatment: '2nd month',
              registrationGroup: 'New',
              presumptiveDsOrDr: 'Presumptive DS-TB',
              referringHealthFacility: 'RITM',
            }),
            sampleExternalId: 'P-DST-MOTT',
            deviceTypeExternalId: 'PhilippinesNtrl',
            resultData: JSON.stringify({
              INH: {
                sirStatus: 'R',
              },
              RIF: {
                sirStatus: 'R',
              },
              EMB: {
                sirStatus: 'S',
              },
              S: {
                sirStatus: 'S',
              },
              encodedResult: {
                isoniazid: 'RESISTANT',
                rifampicin: 'RESISTANT',
                ethambutol: 'SUSCEPTIBLE',
                streptomycin: 'SUSCEPTIBLE',
              },
            }),
          },
          {
            site: {
              id: 'NTRL',
              name: 'NTRL',
              shortName: 'NTRL',
            },
            assayExternalId: 'assayLPA',
            resultCategory1ExternalId: 'PositiveMTB',
            resultCategory2ExternalId: 'Susceptible',
            resultPatientData: JSON.stringify({
              mrfDateRequested: '2022-2-22 2:22',
              monthOfTreatment: '3rd month',
              registrationGroup: 'New',
              presumptiveDsOrDr: 'Presumptive DR-TB',
              referringHealthFacility: 'RITM',
            }),
            sampleExternalId: 'P-LPA-PATIENT',
            deviceTypeExternalId: 'PhilippinesNtrl',
            resultData: JSON.stringify({
              encodedResult: {
                MTB: 'PositiveMTB',
                H: 'Resistance Not detected',
                R: 'Resistance Not Detected',
                FQ: 'Resistance Not Detected',
                SLI: 'Resistance Not Detected',
              },
            }),
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
              id: dataSource.sampleOriginSiteExternalId,
            },
            collectedOn: dataSource.sampleCollectedOn,
            data: dataSource.sampleData
              ? JSON.parse(dataSource.sampleData)
              : {},
          }
          let examResult = null
          if (dataSource.assayExternalId === 'assaySmear') {
            examResult = {
              RESULT:
                smearResultCodeMappings[dataSource.resultCategory1ExternalId] ||
                '6',
              NUM_AFB: 'N/A',
            }
          } else if (
            ['GxMtbRif', 'GxMtbRifUltra'].includes(dataSource.assayExternalId)
          ) {
            examResult = {
              MTB:
                xpertResultCodeMappings[dataSource.resultCategory1ExternalId] ||
                '3',
              RIF:
                xpertRifResultCodeMappings[
                  dataSource.resultCategory2ExternalId
                ] || '6',
            }
          } else if (
            dataSource.assayExternalId === 'assayTbLamp' &&
            ['Negative', 'Positive'].includes(
              dataSource.resultCategory1ExternalId
            )
          ) {
            examResult = {
              RESULT:
                tbLampResultCodeMappings[
                  dataSource.resultCategory1ExternalId
                ] || '3',
            }
          } else if (
            ['assayBdMgitGnd', 'assayGenericCulture'].includes(
              dataSource.assayExternalId
            ) &&
            [
              'NotDetected',
              'Detected',
              'PositiveMTB',
              'PositiveMOTT',
              'Contaminated',
              'Missing',
              'Unknown',
            ].includes(dataSource.resultCategory1ExternalId)
          ) {
            examResult = {
              RESULT:
                cultureResultCodeMappings[
                  dataSource.resultCategory1ExternalId
                ] || '4',
            }
          } else if (
            ['assayBdMgitAst', 'assayGenericDst'].includes(
              dataSource.assayExternalId
            ) &&
            ['Detected', 'PositiveMTB'].includes(
              dataSource.resultCategory1ExternalId
            ) &&
            ['Resistant', 'Susceptible', 'Contaminated'].includes(
              dataSource.resultCategory2ExternalId
            )
          ) {
            examResult = {
              H:
                dstResultCodeMappings[
                  _.get(resultData, 'encodedResult.isoniazid') ||
                    mgitSireStatusToEncodedMappings[
                      _.get(resultData, 'INH.sirStatus')
                    ] ||
                    'NOT DONE'
                ] || 'ND',
              R:
                dstResultCodeMappings[
                  _.get(resultData, 'encodedResult.rifampicin') ||
                    mgitSireStatusToEncodedMappings[
                      _.get(resultData, 'RIF.sirStatus')
                    ] ||
                    'NOT DONE'
                ] || 'ND',
              Z:
                dstResultCodeMappings[
                  _.get(resultData, 'encodedResult.pyrazinamide') || 'NOT DONE'
                ] || 'ND',
              E:
                dstResultCodeMappings[
                  _.get(resultData, 'encodedResult.ethambutol') ||
                    mgitSireStatusToEncodedMappings[
                      _.get(resultData, 'EMB.sirStatus')
                    ] ||
                    'NOT DONE'
                ] || 'ND',
              S:
                dstResultCodeMappings[
                  _.get(resultData, 'encodedResult.streptomycin') ||
                    mgitSireStatusToEncodedMappings[
                      _.get(resultData, 'S.sirStatus')
                    ] ||
                    'NOT DONE'
                ] || 'ND',
              Km:
                dstResultCodeMappings[
                  _.get(resultData, 'encodedResult.kanamycin') || 'NOT DONE'
                ] || 'ND',
              Cm:
                dstResultCodeMappings[
                  _.get(resultData, 'encodedResult.capreomycin') || 'NOT DONE'
                ] || 'ND',
              Ofx:
                dstResultCodeMappings[
                  _.get(resultData, 'encodedResult.ofloxacin') || 'NOT DONE'
                ] || 'ND',
              Lfx:
                dstResultCodeMappings[
                  _.get(resultData, 'encodedResult.levofloxacin') || 'NOT DONE'
                ] || 'ND',
              Cs: 'ND',
              Am:
                dstResultCodeMappings[
                  _.get(resultData, 'encodedResult.amikacin') || 'NOT DONE'
                ] || 'ND',
            }
          } else if (
            dataSource.assayExternalId === 'assayLPA' &&
            ['NotDetected', 'Invalid', 'PositiveMTB'].includes(
              dataSource.resultCategory1ExternalId
            )
          ) {
            examResult = {
              MTB: lpaMtbResultCodeMappings[
                dataSource.resultCategory1ExternalId
              ],
              H:
                lpaHighLowResistanceCodeMappings[
                  _.get(resultData, 'encodedResult.isoniazid')
                ] || '3',
              R:
                lpaResistanceCodeMappings[
                  _.get(resultData, 'encodedResult.rifampicin')
                ] || '3',
              FQ:
                lpaResistanceCodeMappings[
                  _.get(resultData, 'encodedResult.fluoroquinolones')
                ] || '3',
              SLI:
                dstResultCodeMappings[
                  _.get(resultData, 'encodedResult.aminoglycoside')
                ] || '3',
            }
          }
          let reasonFormExamination = 'NULL'
          if (/^PT\d*/i.test(resultPatientData.monthOfTreatment)) {
            reasonFormExamination =
              postTreatmentReasonForExaminationCodes[
                /^PT(\d*)/i.exec(resultPatientData.monthOfTreatment)[1]
              ]
          } else if (
            resultPatientData.treatmentSchedule &&
            resultPatientData.treatmentSchedule.toLocaleLowerCase() ===
              'diagnosis'
          ) {
            reasonFormExamination = '938492'
          } else if (
            ['bas', 'baseline'].includes(
              (resultPatientData.treatmentSchedule || '').toLowerCase()
            )
          ) {
            reasonFormExamination = '938493'
          } else if (/\d*/.test(resultPatientData.monthOfTreatment)) {
            reasonFormExamination =
              monthOfTreatmentReasonForExaminationCodes[
                /(\d*)/.exec(resultPatientData.monthOfTreatment)[1]
              ]
          }
          const message = await runProcessUsingDataSourceQuery(
            template,
            useCase,
            ['urlTemplate']
          )
          expect(message.url).to.equal(
            `${philippinesITISWebApiUrl}/gX%40leR%2B%21Ti%24` +
              `/TB_CASE_NUMBER/${encodeURIComponent(
                resultPatientData.id || 'NULL'
              )}` +
              `/SPECIMEN_CODE/${encodeURIComponent(
                resultSample.id || 'NULL'
              )}` +
              `/REQUESTING_FACILITY/${encodeURIComponent(
                resultSample.originSite.id ||
                  resultPatientData.referringHealthFacility ||
                  'NULL'
              )}` +
              `/DATE_OF_REQUEST/${
                formatDateOrDefault(
                  parseDateOrDefault(resultPatientData.mrfDateRequested, {
                    defaultDate: null,
                  }),
                  itisDateFormat
                ) || 'NULL'
              }` +
              `/FACILITY_CONTACT/${encodeURIComponent(
                resultPatientData.facilityContactNumber || 'NULL'
              )}` +
              `/REQUESTING_PHYSICIAN/${encodeURIComponent(
                resultPatientData.requestingPhysician || 'NULL'
              )}` +
              `/PATIENT_LAST_NAME/${encodeURIComponent(
                resultPatientData.lastName || 'NULL'
              )}` +
              `/PATIENT_FIRST_NAME/${encodeURIComponent(
                resultPatientData.firstName || 'NULL'
              )}` +
              `/PATIENT_MIDDLE_NAME/${encodeURIComponent(
                resultPatientData.middleInitialOrName || 'NULL'
              )}` +
              `/PATIENT_AGE/${
                _.isNil(resultPatientData.age) ||
                _.isNil(resultPatientData.age.toString().match(/^(\d*)(.*)$/g))
                  ? 'NULL'
                  : /^(\d*)(.*)$/g.exec(resultPatientData.age.toString())[1] ||
                    'NULL'
              }` +
              `/PATIENT_ADDRESS/${encodeURIComponent(
                resultPatientData.address || 'NULL'
              )}` +
              `/SEX/${
                { Male: 'M', Female: 'F' }[resultPatientData.sex] || 'NULL'
              }` +
              `/PATIENT_MOBILE_NUMBER/${encodeURIComponent(
                (
                  (resultData.customFieldData || []).find(
                    customField => customField.label === 'Patient Phone'
                  ) || {}
                ).value ||
                  resultPatientData.phone ||
                  'NULL'
              )}` +
              `/PATIENT_LANDLINE_NUMBER/${encodeURIComponent(
                (
                  (resultData.customFieldData || []).find(
                    customField =>
                      customField.label === "Patient's Landline No."
                  ) || {}
                ).value || 'NULL'
              )}` +
              `/PATIENT_EMAIL/${encodeURIComponent(
                (
                  (resultData.customFieldData || []).find(
                    customField =>
                      customField.label === "Patient's Email Address"
                  ) || {}
                ).value || 'NULL'
              )}` +
              `/REASON_FOR_EXAMINATION/${reasonFormExamination || 'NULL'}` +
              `/REGISTRATION_GROUP/${
                {
                  New: '938610',
                  NEW: '938610',
                  RELAPSE: '938611',
                  TALF: '938613',
                  'TX AFTER LOST TO FF-UP': '938613',
                  'TX AFTER FAILURE': '938614',
                  TAF: '938614',
                  PTOU: '938615',
                  'PREVIOUS TX OUTCOME UNKNOWN': '938615',
                  OTHER: '938616',
                }[resultPatientData.registrationGroup] || '938616'
              }` +
              `/SPECIMEN_TYPE/${
                { Sputum: '0', Isolates: '1', Others: '1' }[
                  resultSample.data.type
                ] || 'NULL'
              }` +
              `/REPEAT_COLLECTION/${
                { Yes: '1', No: '0' }[resultSample.data.repeatCollection] ||
                'NULL'
              }` +
              `/PRESUMPTIVE_TB_DSDR/${
                {
                  'Presumptive DS-TB': '0',
                  'Presumptive DR-TB': '1',
                }[resultPatientData.presumptiveDsOrDr] || 'NULL'
              }` +
              `/DATE_SPECIMEN_COLLECTED/${
                formatDateOrDefault(
                  parseDateOrDefault(resultSample.collectedOn, {
                    defaultDate: null,
                  }),
                  itisDateFormat
                ) || 'NULL'
              }` +
              `/VISUAL_APPEARANCE/${
                {
                  'Muco-purulent': '938638',
                  'Blood-stained': '938639',
                  Salivary: '938640',
                  Mucosalivary: '938672',
                  Purulent: '938891',
                }[resultSample.data.appearance] || 'NULL'
              }` +
              `/EXAM_TYPE/${
                {
                  assaySmear: 'DSSM',
                  GxMtbRif: 'XPERT_MTBRIF',
                  GxMtbRifUltra: 'XPERT_MTBRIF',
                  assayTbLamp: 'TB_LAMP',
                  assayGenericCulture: 'CULTURE',
                  assayBdMgitGnd: 'CULTURE',
                  assayBdMgitAst: 'DST',
                  assayGenericDst: 'DST',
                  assayLPA: 'LPA',
                }[dataSource.assayExternalId]
              }` +
              `/EXAM_RESULT/${
                examResult === null
                  ? 'NULL'
                  : encodeURIComponent(JSON.stringify(examResult))
              }` +
              `/DATE_OF_RELEASE/${
                formatDateOrDefault(
                  parseDateOrDefault(
                    _.get(resultData, 'encodedResult.dateReleased'),
                    {
                      defaultDate: null,
                    }
                  ),
                  itisDateFormat
                ) || 'NULL'
              }` +
              `/PERFORMED_BY/${encodeURIComponent(
                _.get(resultData, 'encodedResult.examiner') ||
                  _.get(resultData, 'encodedResult.labTech') ||
                  dataSource.senderOperator ||
                  'NULL'
              )}`
          )
        })
      })
    })
  })
})
