const Joi = require('@hapi/joi')
const proxyquire = require('proxyquire')
const { assert } = require('chai')
const _ = require('lodash')
const endpointUtils = require('../utils/endpointUtils')
const {
  resultBasedNotificationPayload,
} = require('../../src/notification/validations')

describe('notification endpoints', () => {
  function setupRoute(method, path, serviceStub) {
    const endpoints = proxyquire('../../src/notification/endpoints', {
      './service': serviceStub,
    })
    return _.find(endpoints.routes, { method, path })
  }

  describe('GET', () => {
    describe('/notification', () => {
      let endpoint
      const expectedResponse = { value: 'Expected result' }

      beforeEach(() => {
        endpoint = setupRoute('GET', '/notification', {
          async listNotifications() {
            return expectedResponse
          },
        })
      })
      it('Should respond with the data returned from the service', done => {
        endpointUtils
          .callHandlerOn(endpoint)
          .handleResponseWith(response => {
            assert.deepEqual(response, expectedResponse)
          })
          .thenCall(done)
          .execute()
      })
    })
  })

  describe('check validations for saving notification', () => {
    let payload
    let validation
    const schema = Joi.object(resultBasedNotificationPayload)
    const resultBasedNotification = {
      notificationType: 'resultBased',
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
    }

    it('should save new result-based notification when posted with all required fields', async () => {
      payload = {
        ...resultBasedNotification,
        jobFunctions: resultBasedNotification.jobFunctions.filter(
          ({ checked }) => checked
        ),
      }
      validation = schema.validate(payload)
      assert.isUndefined(validation.error)
      assert.equal(JSON.stringify(validation.value), JSON.stringify(payload))
    })

    describe('should fail to save result-based notification when some fields are missing', async () => {
      it('wrong notificationType', async () => {
        payload = {
          ...resultBasedNotification,
          notificationType: 'wrong',
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })

      it('missing/wrong "result" or some inner prop', async () => {
        payload = {
          ...resultBasedNotification,
          result: undefined,
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)

        payload = {
          ...resultBasedNotification,
          result: [
            {
              ...resultBasedNotification.result[0],
              assayId: null,
            },
          ],
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)

        payload = {
          ...resultBasedNotification,
          result: [
            {
              ...resultBasedNotification.result[0],
              resultCategoryId: null,
            },
          ],
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)

        payload = {
          ...resultBasedNotification,
          result: [
            {
              ...resultBasedNotification.result[0],
              resultCategoryId: [
                {
                  ...resultBasedNotification.result[0].resultCategoryId[0],
                  value: null,
                },
              ],
            },
          ],
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)

        payload = {
          ...resultBasedNotification,
          result: [
            {
              ...resultBasedNotification.result[0],
              resultCategoryId: [
                {
                  ...resultBasedNotification.result[0].resultCategoryId[0],
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
          ...resultBasedNotification,
          areaItems: '', // deviceLevelId='state' and requires areaItems to be set
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })

      it('missing/wrong jobFunctions', async () => {
        payload = {
          ...resultBasedNotification,
        }
        // failing because some jobFunctions have checked=false
        validation = schema.validate(payload)
        assert.isDefined(validation.error)

        payload = {
          ...resultBasedNotification,
          jobFunctions: null,
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)

        payload = {
          ...resultBasedNotification,
          jobFunctions: [],
        }
        validation = schema.validate(payload)
        assert.isDefined(validation.error)
      })
    })
  })
})
