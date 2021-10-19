const chai = require('chai')
const Promise = require('bluebird')
const _ = require('lodash')
const { rowsAsObject } = require('../../seeds/utils')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')
const server = require('../utils/testUtils')
const {
  dispatchAndWaitForAction,
  waitForIdle,
  createMessageContext,
  updateSubscription,
} = require('../utils/mqUtils')
const { createResult, getResult } = require('../result/result_utils')
const { deviceApprovalToId } = require('../../src/shared/dictionary')
const {
  createGxConnectTestContext,
} = require('../deviceApi/geneXpert/gxconnect_utils')
const { resultLogged } = require('../../src/result/actions')
const { issueCreated } = require('../../src/issue/actions')
const {
  notificationTypeCategoryToId,
  resultCategoryToId,
  issueStatusToId,
} = require('../../src/shared/dictionary')

const { assert } = chai
describe('Issue based Notifications triggers', () => {
  let insertedIssueId = null
  before(async () => {
    const issueTypes = await knex('IssueType').pluck('id')
    const resultSample = await knex('Result').first()
    const messageTypes = await knex('MessageType')
      .whereNotNull('smsTemplateId')
      .select()

    const notificationTypeCategoryId = await notificationTypeCategoryToId(
      'issueBased'
    )
    const createdOn = new Date()
    const updatedOn = new Date()
    const issueTypeId = _.sample(issueTypes)

    await knex('NotificationType').insert({
      partnerId: resultSample.partnerId,
      name: 'Random issue based notification',
      createdOn,
      updatedOn,
      notificationTypeCategoryId,
      issueTypeId,
      messageTypeId: _.sample(messageTypes).id,
    })
    const issueStatusId = await issueStatusToId('Active')
    ;[insertedIssueId] = await knex('Issue').insert({
      partnerId: resultSample.partnerId,
      deviceId: resultSample.deviceId,
      siteId: resultSample.siteId,
      issueStatusId,
      issueTypeId,
      createdOn,
      updatedOn,
    })
  })
  after(async () => {
    await knex('Notification').where('issueId', insertedIssueId).delete()
    await knex('Issue').where({ id: insertedIssueId }).delete()
    await knex('NotificationType')
      .where({ name: 'Random issue based notification' })
      .delete()
  })
  it('should create a issue based notification without special filter conditions', async () => {
    let notifications = await knex('Notification')
      .where({ issueId: insertedIssueId })
      .select()
    assert.equal(notifications.length, 0)
    await dispatchAndWaitForAction(issueCreated(insertedIssueId))
    await waitForIdle(1000)
    notifications = await knex('Notification')
      .where({ issueId: insertedIssueId })
      .select()
    assert.equal(notifications.length, 1)
  })
})

describe.only('Result Notifications triggers', () => {
  let results = []
  let messageContext
  const filterConditionWithAssay = {
    result: [
      {
        assayId: 'DaktariHivVL',
        resultCategoryId: [
          {
            label: 'Detected',
            scope: 'ResultCategories',
            value: 'Detected',
          },
        ],
      },
    ],
    areaItems: [
      {
        label: 'Jackson',
        value: '13',
      },
    ],
    deviceLevelId: 'lga',
  }
  let resultCategory1
  const filterConditionWithJf = {
    result: [
      {
        assayId: 'DaktariHivVL',
        resultCategoryId: [
          {
            label: 'Detected',
            scope: 'ResultCategories',
            value: 'Detected',
          },
        ],
      },
    ],
    areaItems: [
      {
        label: 'Wayne',
        value: '12',
      },
    ],
    jobFunctions: [
      {
        tags: [],
        jobFunctionId: '1',
      },
      {
        tags: [],
        jobFunctionId: '2',
      },
    ],
    deviceLevelId: 'lga',
  }
  const notificationTypesToDelete = []
  const createTestContext = async (filterCondition, partnerId = 1) => {
    resultCategory1 = await resultCategoryToId('Detected')
    results = await knex('Result as r')
      .join('Geography as g', 'r.geographyId', 'g.id')
      .join('Lga as l', 'g.lgaId', 'l.id')
      .where({ partnerId })
      .whereNotExists(
        knex('Notification as n').whereRaw('n.resultId = r.id').select()
      )
      .distinct('r.*', 'l.name as lgaName')
    assert.isAtLeast(results.length, 1)
    const messageTypes = await knex('MessageType')
      .whereNotNull('smsTemplateId')
      .select()

    const notificationTypeCategoryId = await notificationTypeCategoryToId(
      'resultBased'
    )

    const [ntNoFilterConditionId] = await knex('NotificationType').insert({
      partnerId: 1,
      name: 'Result based notification',
      createdOn: new Date(),
      updatedOn: new Date(),
      notificationTypeCategoryId,
      filterCondition: JSON.stringify(filterCondition),
      messageTypeId: _.sample(messageTypes).id,
    })
    notificationTypesToDelete.push(ntNoFilterConditionId)
    messageContext = await createMessageContext()

    await updateSubscription('notification')
  }
  const removeTestContext = async () => {
    const ntToDelete = notificationTypesToDelete.shift()
    await knex('Notification')
      .whereIn(
        'resultId',
        _.map(results, r => r.id)
      )
      .orWhere({ notificationTypeId: ntToDelete })
      .delete()
    await knex('NotificationType').where({ id: ntToDelete }).delete()
    results = []
  }
  describe('Filter without JF', () => {
    let deviceContext
    let device2Context
    let results2

    const filterConditionForJackson = {
      result: [
        {
          assayId: 'assayTypeMtbRif',
          resultCategoryId: [
            {
              label: 'Detected',
              scope: 'ResultCategories',
              value: 'Detected',
            },
          ],
        },
      ],
      areaItems: [
        {
          label: 'Jackson',
          value: '13',
        },
      ],
      deviceLevelId: 'lga',
    }

    before(async () => {
      deviceContext = await createGxConnectTestContext(server, {
        countryCode: 'US',
        adminUsername: 'admin',
        adminPassword: 'test07',
        deviceName: `My super device`,
        macAddress: `Oh wow, look at that MAC ADDRESS!`,
        hostId: `SuperHostId`,
        deviceSerialNumber: `My device serial number`,
        siteExternalId: 'Oregon_Jackson',
      })
      device2Context = await createGxConnectTestContext(server, {
        countryCode: 'US',
        adminUsername: 'admin',
        adminPassword: 'test07',
        deviceName: `My super device number 2`,
        macAddress: `Oh wow, look at that MAC ADDRESS number 2!`,
        hostId: `SuperHostId2`,
        deviceSerialNumber: `My device serial number 2`,
        siteExternalId: 'Oregon_Hood River',
      })

      await deviceContext.registerAndSetDevice()
      await device2Context.registerAndSetDevice()
      await createTestContext(
        filterConditionWithAssay,
        deviceContext.device.partnerId
      )
      await device2Context.createResultForThisDevice()
      await deviceContext.createResultForThisDevice()
      const queryBuilder = builder =>
        builder
          .join('Geography as g', 'g.id', 'r.geographyId')
          .join('Lga as l', 'g.lgaId', 'l.id')
          .select('l.name as lgaName')
      results = await deviceContext.getAllResults(queryBuilder)
      results2 = await deviceContext.getAllResults(queryBuilder)
    })
    after(async () => {
      await deviceContext.cleanUp(false)
      await device2Context.cleanUp(false)
      await removeTestContext()
    })
    describe('Filter for Jackson county and Detected result', () => {
      let sampleResult = null
      before(async () => {
        sampleResult = _.sample(results)
        assert.isNotNull(sampleResult)
        await createTestContext(
          filterConditionWithAssay,
          deviceContext.device.partnerId
        )
      })
      after(async () => {
        await Promise.each(
          ['EmailMessage', 'SmsMessage', 'AlertMessage', 'Notification'],
          table => knex(table).where({ resultId: sampleResult.id }).delete()
        )
        await knex('Result').where({ id: sampleResult.id }).delete()
        await removeTestContext()
      })
      it('should create a result based notification for particular lga', async () => {
        console.log('sampleResult', sampleResult)
        messageContext.dispatch(resultLogged(sampleResult.id, 1, 1))
        await waitForIdle(1000)
        const notifications = await knex('Notification')
          .where({ resultId: sampleResult.id })
          .distinct()
        assert.isAtLeast(notifications.length, 1)
      })
    })
    it('should NOT create a result based notification for result category distinct to detected', async () => {
      console.log(
        'Filtered REsults',
        results.length,
        _.filter(results, elem => elem.resultCategory1 !== resultCategory1)
      )
      const resultId = _.sample(
        _.filter(results, elem => elem.resultCategory1 !== resultCategory1)
      ).id
      assert.isNotNull(resultId)
      messageContext.dispatch(resultLogged(resultId, 1, 1))
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ resultId })
        .select()
      assert.isEmpty(notifications)
    })
    it('should NOT create a result based notification for a different LGA than Jackson', async () => {
      const resultId = _.sample(results2).id
      assert.isNotNull(resultId)
      messageContext.dispatch(resultLogged(resultId, 1, 1))
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ resultId })
        .select()
      assert.isEmpty(notifications)
    })
  })
  describe('Filter by JF', () => {
    let inserted
    before(async () => createTestContext(filterConditionWithJf))
    after(async () => {
      await removeTestContext()
      await knex('PersonTag').where('TagId', '>=', inserted).delete()
      await knex('Tag')
        .whereIn('title', ['oneTag', 'secondTag', 'thirdTag'])
        .delete()
    })
    afterEach(async () =>
      knex('Notification')
        .whereIn(
          'resultId',
          _.map(results, r => r.id)
        )
        .delete()
    )
    it('should create a result based notification for particular jobFunctions', async () => {
      const resultId = _.sample(
        _.filter(
          results,
          elem =>
            elem.lgaName === 'Wayne' && elem.resultCategory1 === resultCategory1
        )
      ).id
      assert.isNotNull(resultId)
      await dispatchAndWaitForAction(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      const notifications = await knex('Notification')
        .where({ resultId })
        .distinct()
      assert.equal(notifications.length, 1)
    })
    it('Should create or not  a result based notification filtering by  JobFunction and tags', async () => {
      ;[inserted] = await knex('Tag').insert([
        { partnerId: 1, title: 'oneTag' },
        { partnerId: 1, title: 'secondTag' },
        { partnerId: 1, title: 'thirdTag' },
      ])
      const notificationTypeCategoryId = await notificationTypeCategoryToId(
        'resultBased'
      )
      let resultId = _.sample(
        _.filter(
          results,
          elem =>
            elem.lgaName === 'Wayne' && elem.resultCategory1 === resultCategory1
        )
      ).id
      messageContext.dispatch(resultLogged(resultId, 1, 1))
      let notifications = await knex('Notification')
        .where({ resultId })
        .distinct()
      assert.equal(notifications.length, 0)
      await knex('NotificationType')
        .update({
          filterCondition: JSON.stringify({
            ...filterConditionWithJf,
            jobFunctions: [
              {
                tags: [{ label: 'oneTag', value: inserted }],
                jobFunctionId: '1',
              },
              {
                tags: [{ label: 'secondTag', value: inserted + 1 }],
                jobFunctionId: '2',
              },
            ],
          }),
        })
        .where({ notificationTypeCategoryId })
      messageContext = await createMessageContext()
      await updateSubscription('notification')
      await waitForIdle(1000)
      resultId = _.sample(
        _.filter(
          results,
          elem =>
            elem.lgaName === 'Wayne' && elem.resultCategory1 === resultCategory1
        )
      ).id
      assert.isNotNull(resultId)
      const personTags = await knex('Person as p')
        .join('Job as j', 'j.personId', 'p.id')
        .whereIn('j.jobFunctionId', [1])
        .pluck('p.id')
      const person = _.sample(personTags)
      await knex('PersonTag').insert({ personId: person, tagId: inserted })
      messageContext.dispatch(resultLogged(resultId, 1, 1))
      await waitForIdle(1000)
      notifications = await knex('Notification as n')
        .join('NotificationType as nt', 'n.notificationTypeId', 'nt.id')
        .where({
          resultId,
          'nt.notificationTypeCategoryId': notificationTypeCategoryId,
        })
        .distinct()
      console.log('notifications', notifications)
      assert.equal(notifications.length, 1)
    })
  })
  describe('With unaproved devices ', () => {
    let deviceContext
    before(async () => {
      deviceContext = await createGxConnectTestContext(server, {
        countryCode: 'US',
        adminUsername: 'admin',
        adminPassword: 'test07',
        deviceName: `An Epic Device`,
        macAddress: `Oh wow, look at that MAC ADDRESS!`,
        hostId: `SuperHostId`,
        deviceSerialNumber: `I don't have more ideas`,
        siteExternalId: 'Oregon_Jackson',
      })
      await deviceContext.registerAndSetDevice('decommissioned')
      await createTestContext(
        filterConditionWithAssay,
        deviceContext.device.partnerId
      )
    })
    after(async () => {
      await deviceContext.cleanUp(false)
      await removeTestContext()
    })
    it("When the device is unauthorized it shouldn't sent any notification", async () => {
      const deviceApprovedStatus = await deviceApprovalToId('approved')
      const { DeviceApprovalId } = await knex('Device')
        .where({ hostId: 'SuperHostId' })
        .first('DeviceApprovalId')
      assert.notEqual(DeviceApprovalId, deviceApprovedStatus)
      const { device } = deviceContext
      const { notificationsForDevice } = await knex('Notification as n')
        .join('Result as r', 'r.id', 'n.resultId')
        .where('r.deviceId', device.id)
        .count('n.id as notificationsForDevice')
        .first()
      assert.equal(notificationsForDevice, 0)
      await deviceContext.createResultForThisDevice()
      const [result] = await deviceContext.getAllResults()
      messageContext.dispatch(resultLogged(result.id, 1, 1))
      await waitForIdle(1000)
      const { notificationsForDeviceWithResults } = await knex(
        'Notification as n'
      )
        .join('Result as r', 'r.id', 'n.resultId')
        .where('r.deviceId', device.id)
        .count('n.id as notificationsForDeviceWithResults')
        .first()
      assert.equal(notificationsForDeviceWithResults, 0)
    })
  })
})
describe('Notification routes', () => {
  const path = '/api/notification'

  const now = new Date()
  const sampleIssues = [
    'DeviceOffline',
    'DeviceMaintenance',
    'ModuleFailureError',
  ]

  const ntArr = []

  beforeEach(async () => {
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

  afterEach(async () => {
    return Promise.each(ntArr, async ntId => {
      await knex('Notification').where('notificationTypeId', ntId).del()
      await knex('NotificationType').where('id', ntId).del()
    })
  })

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
})
