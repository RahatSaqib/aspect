const chai = require('chai')
const Promise = require('bluebird')

const { rowsAsObject } = require('../../seeds/utils')
const shared = require('../utils/sharedToken')
const { run } = require('../../src/db')

const server = require('../utils/testUtils')

const { assert } = chai

describe('Notification routes', () => {
  const path = '/api/notification'

  const now = new Date()
  const sampleIssues = [
    'DeviceOffline',
    'DeviceMaintenance',
    'ModuleFailureError',
  ]

  const ntArr = []

  beforeEach(() =>
    run(async knex => {
      const issueTypes = await rowsAsObject(knex, 'IssueType', 'externalId')
      await Promise.each(sampleIssues, async issue => {
        const issueType = issueTypes[issue]
        const [ntId] = await knex('NotificationType').insert({
          partnerId: 1,
          issueTypeId: issueType.id,
          name: issueType.name,
          createdOn: now,
          updatedOn: now,
        })

        ntArr.push(ntId)

        await knex('Notification').insert({
          notificationTypeId: ntId,
          createdOn: now,
        })
      })
    })
  )

  afterEach(() =>
    run(async knex => {
      await Promise.each(ntArr, async ntId => {
        await knex('Notification').where('notificationTypeId', ntId).del()
        await knex('NotificationType').where('id', ntId).del()
      })
    })
  )

  describe('GET /notification', () => {
    shared.checkToken(server, path)

    it('should return a list of notifications when using valid token', async () => {
      const res = await server
        .get(path)
        .set('Authorization', `Bearer ${shared.token}`)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')
      assert.property(res.body, 'data')
      assert.typeOf(res.body.data, 'array')
      assert.isAtLeast(res.body.data.length, 3)
      res.body.data.forEach(notification => {
        assert.property(notification, 'name')
        assert.property(notification, 'lastTriggeredOn')
        assert.property(notification, 'totalTriggers')
        assert.property(notification, 'alertCount')
        assert.property(notification, 'contactsCount')
        assert.property(notification, 'contacts')
      })
    })
  })

  describe('POST /notification', () => {
    shared.checkToken(server, path)

    const postData = payload =>
      server
        .post(path)
        .send(payload)
        .set('Authorization', `Bearer ${shared.token}`)

    const resultBasedNotification = {
      notificationType: 'result-based',
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
      const res = await postData(resultBasedNotification)

      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')

      assert.property(res.body, 'ok')
      assert.equal(res.body.ok, true)
      assert.property(res.body, 'notificationTypeId')
    })

    describe('should fail to save result-based notification when some fields are missing', async () => {
      it('missing/wrong "result" or some inner prop', async () => {
        let res = await postData({
          ...resultBasedNotification,
          result: undefined,
        })
        assert.equal(res.status, 400)

        res = await postData({
          ...resultBasedNotification,
          result: [
            {
              ...resultBasedNotification.result[0],
              assayId: null,
            },
          ],
        })
        assert.equal(res.status, 400)

        res = await postData({
          ...resultBasedNotification,
          result: [
            {
              ...resultBasedNotification.result[0],
              resultCategoryId: null,
            },
          ],
        })
        assert.equal(res.status, 400)

        res = await postData({
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
        })
        assert.equal(res.status, 400)

        res = await postData({
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
        })
        assert.equal(res.status, 400)
      })

      it('missing areaItems', async () => {
        const res = await postData({
          ...resultBasedNotification,
          areaItems: '', // deviceLevelId='state' and requires areaItems to be set
        })
        assert.equal(res.status, 400)
      })

      it('missing/wrong jobFunctions', async () => {
        let res = await postData({
          ...resultBasedNotification,
          jobFunctions: null,
        })
        assert.equal(res.status, 400)

        res = await postData({
          ...resultBasedNotification,
          jobFunctions: [],
        })
        assert.equal(res.status, 400)
      })
    })
  })
})
