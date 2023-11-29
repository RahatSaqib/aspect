const chai = require('chai')
const shared = require('../utils/sharedToken')
const { knex } = require('../../src/db')
const server = require('../utils/testUtils')
const { notificationTypeCategoryToId } = require('../../src/shared/dictionary')

const { assert } = chai

const { baseFilterCondition } = require('./filterConditions')

describe('Notification routes', () => {
  const path = '/api/notification'
  let ntId
  let notificationType
  let personId
  let basePayload
  before(() => {
    shared.checkToken(server, path)
  })
  beforeEach(async () => {
    const messageType = await knex('MessageType').select().first()
    ;[personId] = await knex('Person').where({ name: 'Admin' }).pluck('id')
    ;[ntId] = await knex('NotificationType').insert({
      partnerId: 1,
      name: 'A notification',
      createdOn: new Date(),
      updatedOn: new Date(),
      notificationTypeCategoryId: await notificationTypeCategoryToId('resultBased'),
      filterCondition: JSON.stringify({
        persons: [{ personId, checked: true }],
        jobFunctions: [
          {
            jobFunctionId: 1,
            checked: true,
            tags: [],
          },
        ],
        resultBasedScope: 'any',
      }),
      messageTypeId: messageType.id,
    })
    basePayload = {
      notificationType: 'resultBased',
      resultBasedScope: 'any',
      name: '_____',
      emailSubject: '',
      emailBody: '',
      sendEmail: false,
      smsBody: 'A body',
      sendSms: baseFilterCondition.sendSms,
      webUrl: '',
      webBody: '',
      sendWeb: false,
      jobFunctions: [
        {
          jobFunctionId: 1,
          checked: true,
          tags: [],
        },
      ],
      persons: [
        {
          personId,
          checked: true,
        },
      ],
      deviceLevelId: baseFilterCondition.deviceLevelId,
      areaItems: baseFilterCondition.areaItems,
      result: baseFilterCondition.result,
    }
  })

  afterEach(async () => knex('NotificationType').where('id', ntId).del())

  it('GET - With filterConditions', async () => {
    const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')
    assert.property(res.body, 'data')
    assert.typeOf(res.body.data, 'array')
    assert.isAtLeast(res.body.data.length, 1)
    res.body.data.forEach(notification => {
      assert.property(notification, 'name')
      assert.property(notification, 'lastTriggeredOn')
      assert.property(notification, 'totalTriggers')
      assert.property(notification, 'alertCount')
      assert.property(notification, 'personsCount')
      assert.property(notification, 'persons')
      assert.property(notification, 'jobFunctionsCount')
      assert.property(notification, 'jobFunctions')
    })
    const [{ persons, personsCount }] = res.body.data.filter(n => n.id === ntId)
    assert.equal(persons, 'Admin')
    assert.equal(personsCount, 1)
  })

  it('GET - With jobFunctionId', async () => {
    const res = await server.get(path).set('Authorization', `Bearer ${shared.token}`)

    assert.equal(res.status, 200)
    assert.typeOf(res.body, 'Object')
    assert.property(res.body, 'data')
    assert.typeOf(res.body.data, 'array')
    assert.isAtLeast(res.body.data.length, 1)

    const [{ jobFunctions, jobFunctionsCount }] = res.body.data.filter(n => n.id === ntId)
    assert.equal(jobFunctions, 'Admin')
    assert.equal(jobFunctionsCount, 1)
  })

  it('GET /id', async () => {
    const res = await server.get(`${path}/${ntId}`).set('Authorization', `Bearer ${shared.token}`)

    assert.typeOf(res.body, 'Object')
    assert.property(res.body, 'data')
    assert.typeOf(res.body.data, 'Object')
    assert.equal(res.status, 200)

    notificationType = res.body.data
    assert.property(notificationType, 'notificationTypeName')
    assert.property(notificationType, 'notificationType')
    assert.property(notificationType, 'name')
    assert.property(notificationType, 'filterCondition')
    assert.property(notificationType, 'emailSubject')
    assert.property(notificationType, 'emailBody')
    assert.property(notificationType, 'smsBody')
    assert.property(notificationType, 'webUrl')
    assert.property(notificationType, 'webBody')
  })

  it('PUT - Unexisting person, should return error 400', async () => {
    before(() => {
      shared.checkToken(server, path)
    })

    const res = await server
      .put(`${path}/${ntId}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({
        ...basePayload,
        persons: [
          {
            personId: 99999999999,
            checked: true,
          },
        ],
      })

    assert.equal(res.status, 400)
    assert.equal(res.body.message, 'Attempt to set unexisting person to notification')
  })

  it('PUT - Unexisting job function, should return error 400', async () => {
    const res = await server
      .put(`${path}/${ntId}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({
        ...basePayload,
        jobFunctions: [
          {
            jobFunctionId: 99999999999,
            checked: true,
          },
        ],
      })

    assert.equal(res.status, 400)
    assert.equal(res.body.message, 'Attempt to set unexisting job function to notification')
  })

  it('PUT - Existing person but without assigned job, should return error 400', async () => {
    const personWithoutJob = await knex('Person as p')
      .leftJoin('JobContext as jc', 'p.id', 'jc.personId')
      .whereNull('jc.id')
      .first('p.*')
    const res = await server
      .put(`${path}/${ntId}`)
      .set('Authorization', `Bearer ${shared.token}`)
      .send({
        ...basePayload,
        persons: [
          {
            personId: personWithoutJob.id,
            checked: true,
          },
        ],
      })

    assert.equal(res.status, 400)
    assert.equal(res.body.message, 'Attempt to set to notifications persons without assigned jobs')
  })

  it('PUT - Correct payload, filterCondition should be updated properly', async () => {
    const res = await server.put(`${path}/${ntId}`).set('Authorization', `Bearer ${shared.token}`).send(basePayload)

    assert.equal(res.status, 200)

    const { filterCondition } = await knex('NotificationType').where({ id: ntId }).first()
    assert.deepEqual(JSON.parse(filterCondition), {
      persons: [
        {
          personId,
          checked: true,
        },
      ],
      jobFunctions: [
        {
          jobFunctionId: 1,
          checked: true,
          tags: [],
        },
      ],
      deviceLevelId: baseFilterCondition.deviceLevelId,
      areaItems: [
        {
          label: 'Wayne',
          value: 12,
        },
      ],
      sendEmail: false,
      sendSms: true,
      sendWeb: false,
      result: baseFilterCondition.result,
      enabled: true,
      issueTypeId: null,
      resultBasedScope: 'any',
    })
  })
})
