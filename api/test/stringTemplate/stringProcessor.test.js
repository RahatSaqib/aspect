const _ = require('lodash')
const proxyquire = require('proxyquire')
const Promise = require('bluebird')
const { assert, expect } = require('chai')
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
    }

    async function runProcessUsingDataSourceQuery(
      payloadTemplate,
      changesToMessageDataSource = {}
    ) {
      const data = Object.assign(
        {},
        messageDataSource,
        changesToMessageDataSource,
        { payloadTemplate }
      )
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
        const specifiedFormat = 'YYYY-MMMM-DD'
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
        const redCapDateTimeFormat = 'YYYY-MM-DD HH:mm'
        const template =
          `token=1A234567B8C90D12345E6789F0G1234H&content=record&format=json&type=flat&overwriteBehavior=normal&forceAutoNumber=true&data=%5B%7B%22` +
          `record_id%22%3A%221%22%2C%20` +
          `%22redcap_data_access_group%22%3A{{urlEncode (enclose (toLowerCase (defaultTo site.id '')) with='"')}}%2C%20` +
          `%22first_name%22%3A{{urlEncode (enclose (defaultTo result.formData.nameOfPatient '') with='"')}}%2C%20` +
          `%22surname%22%3A{{urlEncode (enclose (defaultTo result.formData.surnameOfPatient '') with='"')}}%2C%20` +
          `%22hospital_number%22%3A{{urlEncode (enclose (defaultTo result.formData.hospitalNumber '') with='"')}}%2C%20` +
          `%22site_code%22%3A{{urlEncode (enclose (defaultTo (mapValue site.id '{"DNAH":"D","kalafong":"K","CMJAH":"J","RMMCH":"R","CHBAH":"B"}') '') with='"')}}%2C%20` +
          `%22ward_cubicle%22%3A{{urlEncode (enclose (defaultTo result.formData.ward '') with='"')}}%2C%20` +
          `%22sample_category%22%3A{{urlEncode (enclose (defaultTo result.formData.sampleType '') with='"')}}%2C%20` +
          `%22instrument_ca%22%3A{{urlEncode (enclose (defaultTo (mapValue device.deviceType '{"CepheidGeneXpert":"1","AlereQ":"2"}') '') with='"')}}%2C%20` +
          `%22assayhiv%22%3A{{urlEncode (enclose (defaultTo (mapValue result.assay.id '{"assayAlereQHiv12VLPlasma":"1","assayAlereQHiv12Detect":"2","GxHiv1Vl":"1","GxHiv1Qual":"2"}') '') with='"')}}%2C%20` +
          `%22sample_barcode%22%3A{{urlEncode (enclose (defaultTo result.sample.id '') with='"')}}%2C%20` +
          `%22sample_taken%22%3A{{urlEncode (enclose (defaultTo (formatDate result.formData.timeSampleTaken '${redCapDateTimeFormat}') '') with='"')}}%2C%20` +
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
          `%22result_instrument%22%3A{{urlEncode (enclose (defaultTo (formatDate result.formData.timeInstrumentResulted '${redCapDateTimeFormat}') '') with='"')}}` +
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
          kalafong: 'K',
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
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"---","hiv1MNResult":"---","hiv2Result":"---","errorCode":"18006","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'NoResult',
            resultCategory2ExternalId: 'NoResult',
            expectedPocVl: '',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"None","hiv1MNResult":"None","hiv2Result":"None","errorCode":"18006","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedPocVl: '',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Detected","hiv1MNResult":"Undetected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedPocVl: '',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Undetected","hiv1MNResult":"Detected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'NotDetected',
            resultCategory2ExternalId: 'Detected',
            expectedPocVl: '',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Undetected","hiv1MNResult":"Undetected","hiv2Result":"Detected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
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
          const dataSource = Object.assign({}, messageDataSource, useCase)
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
                  formData.timeSampleTaken,
                  redCapDateTimeFormat
                )
              )}%22%2C%20` +
              `%22point_of_care_instrument_r%22%3A%22${
                redCapResultCategoryCodes[
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
                  formData.timeInstrumentResulted,
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
                  formData.timeSampleTaken,
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
                  formData.timeInstrumentResulted,
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

      it('should process SMS Payloads for Results after result detals have been filled out', async () => {
        const template =
          `GxAlert. New case HIV > 50 cps from {{site.shortName}}; ` +
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
            expectedResult: 'HIV+',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Detected","hiv1MNResult":"Undetected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedResult: 'HIV+',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Undetected","hiv1MNResult":"Detected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12Detect',
            resultCategory1ExternalId: 'NotDetected',
            resultCategory2ExternalId: 'Detected',
            expectedResult: 'HIV+',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Undetected","hiv1MNResult":"Undetected","hiv2Result":"Detected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedResult: '2299 cp/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"2299 cp/mL","hiv1MNResult":"Undetected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedResult: '2299 cp/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"< 800 cp/mL","hiv1MNResult":"2299 cp/mL","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedResult: '2299 cp/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"Undetected","hiv1MNResult":"Undetected","hiv2Result":"2299 cp/mL","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedResult: '2299 cp/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"< 800 cp/mL","hiv1MNResult":"Undetected","hiv2Result":"2299 cp/mL","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedResult: '< 800 cp/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"< 800 cp/mL","hiv1MNResult":"Undetected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'assayAlereQHiv12VLPlasma',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedResult: '> 10 000 000 cp/ml',
            deviceTypeExternalId: 'AlereQ',
            resultData: `{"hiv1OResult":"10000001 cp/mL","hiv1MNResult":"Undetected","hiv2Result":"Undetected","errorCode":"0","id":1,"sampleBarcode":"SAMPLE-123","operator":"RHANDZU","resultNo":1,"sampleId":"FUNCTION TEST","testName":"Alere™ q HIV-1/2 Detect","timeStamp":"2018-10-05T13:40:46","pickedUpOn":"2018-11-08T14:06:21.305072","sourceFile":"/home/south_africa_nhls/ftp/alere_q/01-01_NAT-04000925_2018-10-31-11-18-58.csv.zip","cartridgeId":"0479001033","deviceCheck":"Fail","deviceSerial":"NAT-04000925","analysisCheck":"----","negativeControl":"----","sampleDetection":"----","softwareVersion":"0.24.2","hiv1PositiveControl":"----","hiv2PositiveControl":"----"}`,
          },
          {
            assayExternalId: 'GxHiv1Qual',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedResult: 'HIV+',
            deviceTypeExternalId: 'CepheidGeneXpert',
          },
          {
            assayExternalId: 'GxHiv1Qual',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedResult: 'HIV+',
            deviceTypeExternalId: 'CepheidGeneXpert',
          },
          {
            assayExternalId: 'GxHiv1Qual',
            resultCategory1ExternalId: 'NotDetected',
            resultCategory2ExternalId: 'Detected',
            expectedResult: 'HIV+',
            deviceTypeExternalId: 'CepheidGeneXpert',
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedResult: '2299 cp/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":2299}`,
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedResult: '< 800 cp/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":"< 800"}`,
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'NotDetected',
            expectedResult: '2299 cp/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":"2299"}`,
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedResult: '< 800 cp/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":"< 800 cp/ml"}`,
          },
          {
            assayExternalId: 'GxHiv1Vl',
            resultCategory1ExternalId: 'Detected',
            resultCategory2ExternalId: 'Detected',
            expectedResult: '> 10 000 000 cp/ml',
            deviceTypeExternalId: 'CepheidGeneXpert',
            resultData: `{"copies":"10000001"}`,
          },
        ]
        await Promise.each(useCases, async useCase => {
          const dataSource = Object.assign({}, messageDataSource, useCase)
          const formData = JSON.parse(dataSource.resultFormData)
          const message = await runProcessUsingDataSourceQuery(
            template,
            useCase
          )
          const patientData = JSON.parse(dataSource.resultPatientData)
          assert.equal(
            message.payload,
            `GxAlert. New case HIV > 50 cps from ${
              dataSource.siteShortName
            }; ` +
              `in Ward: ${formData.ward}; Sample ID: ${
                dataSource.sampleExternalId
              };  ` +
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
  })
})
