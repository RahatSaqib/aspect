const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')
const { saveNotificationPayload } = require('../../src/notification/validations')

describe('notification endpoints', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/notification/endpoints', {
      './listNotifications': serviceStub,
    })
    return _.find(endpoints.routes, { method, path })
  }

  describe('GET', () => {
    describe('/notification', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/notification', async function () {
          return expectedResponse
        })
      })

      it('Should respond with the data returned from the service', async () => {
        endpointUtils
          .callHandlerOn(endpoint)
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .execute()
      })
    })
  })

  describe('check validations for saving notification', () => {
    let payload
    let validation
    const schema = saveNotificationPayload
    const payloadRaw = {
      notificationType: 'resultBased',
      resultBasedScope: 'any',
      name: 'test name',
      result: [
        {
          assayId: 'abbottM2000DaanNCOVID19',
          resultCategoryId: [
            {
              label: 'Negative',
              scope: 'ResultCategories',
              value: 'Negative',
            },
          ],
        },
        {
          assayId: 'GxMtbRifUltra',
          resultCategoryId: [
            {
              value: 'GxMtbRifUltraMtbDetectedRifDetected',
              label: 'MTB Detected - Rif Detected',
              scope: 'ResultCategoryGroups', // <-- another scope
            },
          ],
        },
      ],
      deviceLevelId: 'state',
      areaItems: [
        {
          label: 'Alabama',
          value: '4',
        },
        {
          label: 'Arizona',
          value: '4',
        },
      ],
      sendEmail: true,
      sendSms: true,
      sendWeb: true,
      emailSubject: 'email subject - {{site.name}}',
      emailBody: 'email body - {{result.data.resultText}}',
      smsBody: 'sms body',
      webUrl: 'http://nowhere.com',
      webBody: 'web body',
      jobFunctions: [
        {
          jobFunctionId: '1',
          checked: true,
          tags: [],
        },
        {
          jobFunctionId: '2',
          checked: true,
          tags: [],
        },
        {
          jobFunctionId: '3',
          checked: false,
          tags: [],
        },
        {
          jobFunctionId: '4',
          checked: false,
          tags: [],
        },
        {
          jobFunctionId: '5',
          checked: false,
          tags: [],
        },
        {
          jobFunctionId: '6',
          checked: false,
          tags: [],
        },
        {
          jobFunctionId: '7',
          checked: false,
          tags: [],
        },
        {
          jobFunctionId: '8',
          checked: false,
          tags: [],
        },
        {
          jobFunctionId: '9',
          checked: false,
          tags: [],
        },
      ],
      enabled: true,
    }
    const payloadGood = {
      ...payloadRaw,
      jobFunctions: payloadRaw.jobFunctions.filter(({ checked }) => checked),
    }

    it('should validate new result-based notification when posted with all required fields', async () => {
      payload = payloadGood
      validation = schema.validate(payload)
      assert.isUndefined(validation.error)
      assert.equal(JSON.stringify(validation.value), JSON.stringify(payload))
    })

    describe('should not validate result-based notification when some fields are missing', async () => {
      it('wrong notificationType', async () => {
        payload = {
          ...payloadGood,
          notificationType: 'wrong',
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })

      it('missing "result" or some inner prop', async () => {
        payload = {
          ...payloadGood,
          result: undefined,
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })

      it('wrong result[].assayId', async () => {
        payload = {
          ...payloadGood,
          result: [
            {
              ...payloadGood.result[0],
              assayId: null,
            },
          ],
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })
      it('wrong result[].resultCategoryId', async () => {
        payload = {
          ...payloadGood,
          result: [
            {
              ...payloadGood.result[0],
              resultCategoryId: null,
            },
          ],
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })
      it('wrong result[].resultCategoryId[].value', async () => {
        payload = {
          ...payloadGood,
          result: [
            {
              ...payloadGood.result[0],
              resultCategoryId: [
                {
                  ...payloadGood.result[0].resultCategoryId[0],
                  value: null,
                },
              ],
            },
          ],
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })
      it('wrong result[].resultCategoryId[].scope', async () => {
        payload = {
          ...payloadGood,
          result: [
            {
              ...payloadGood.result[0],
              resultCategoryId: [
                {
                  ...payloadGood.result[0].resultCategoryId[0],
                  scope: 'Invalid value',
                },
              ],
            },
          ],
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })

      it('missing areaItems', async () => {
        payload = {
          ...payloadGood,
          areaItems: '', // deviceLevelId='state' and requires areaItems to be set
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })

      it('wrong webUrl - pattern error', async () => {
        payload = {
          ...payloadGood,
          webUrl: 'http:/some-domain',
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })
      it('wrong webUrl - bad scheme', async () => {
        payload = {
          ...payloadGood,
          webUrl: 'badscheme://some.com',
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })
      it('wrong webUrl - missing domain', async () => {
        payload = {
          ...payloadGood,
          webUrl: 'http://',
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })

      it('wrong jobFunctions - unchecked items', async () => {
        payload = {
          ...payloadRaw,
        }
        // failing because some jobFunctions have checked=false
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })
      it('wrong jobFunctions - null', async () => {
        payload = {
          ...payloadGood,
          jobFunctions: null,
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })

      it('wrong jobFunctions - []', async () => {
        payload = {
          ...payloadGood,
          jobFunctions: [],
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })

      it('wrong persons - null', async () => {
        payload = {
          ...payloadGood,
          persons: null,
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })

      it('wrong persons - []', async () => {
        payload = {
          ...payloadGood,
          persons: [],
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })

      it('wrong jobFunctions and persons - both undefined', async () => {
        payload = _.omit(payloadGood, ['jobFunctions', 'persons'])
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })

      it('missing all notification channels - false', async () => {
        payload = {
          ...payloadGood,
          sendEmail: false,
          sendSms: false,
          sendWeb: false,
        }
        // failing because missing all sendEmail, sendSms, sendWeb
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })
      it('missing all notification channels - undefined', async () => {
        payload = {
          ...payloadGood,
          sendEmail: undefined,
          sendSms: undefined,
          sendWeb: undefined,
        }
        // failing because missing all sendEmail, sendSms, sendWeb
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })
      it('set at least one notification channel', async () => {
        payload = {
          ...payloadGood,
          sendEmail: false,
          sendSms: true,
          sendWeb: false,
        }
        // succeeding because we set sendSms
        validation = schema.validate(payload)
        assert.isUndefined(validation.error)
      })
    })
  })
})
