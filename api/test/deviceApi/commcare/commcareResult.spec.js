const chai = require('chai')
const { getCommCarePayload } = require('./commcare_utils')
const {
  createTestContext,
  getDeviceFromApiKey,
  getLastResult,
  getLastResultId,
} = require('../utils')
const { waitForIdle } = require('../../utils/mqUtils')

const server = require('../../utils/testUtils')

const { assert } = chai
const { knex } = require('../../../src/db')

const pluginPath = '/device/plugin/commcare'

describe('CommCare Result API routes', () => {
  describe('Check patient phone normalization malawi', () => {
    const context = createTestContext(server, {
      user: 'reporter_admin',
      password: 'test07',
      type: 'CommCareApp',
      partner: 'Reporter',
      site: 'commcare3',
    })

    before(async () => {
      await context.createSites(['commcare3'])
      await context.createDeviceWithApiKey()
    })
    afterEach(context.afterEach)
    it('should add and return device results with normalized malawi phone', async () => {
      const { apiKey } = context

      const payload = getCommCarePayload({
        id: '9999',
        resultText: 'positive',
        hcwResult: 'positive',
        age: 28,
        gender: 'male',
      })
      payload.form.phone_number = '123 456-78'
      await server
        .post(pluginPath)
        .auth('commcare_test', apiKey.token)
        .send(payload)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })
      const { id: deviceId } = await getDeviceFromApiKey(knex, apiKey)

      const result = await getLastResult(knex, deviceId)
      assert.equal(result.id, '9999')
      assert.equal(result.data.resultText, 'positive')
      assert.equal(result.data.hcwConfirmatoryResult, 'positive')
      assert.equal(result.patient.gender, 'male')
      assert.equal(result.patient.phone, '+26512345678')
    })
  })
  describe('check patient phone normalization after payload transformation myanmar', () => {
    const context = createTestContext(server, {
      user: 'myanmar_admin',
      password: 'test07',
      type: 'CommCareApp',
      partner: 'Myanmar',
      site: 'commcare2',
    })

    before(async () => {
      await context.createSites(['commcare2'])
      await context.createDeviceWithApiKey()
    })
    afterEach(context.afterEach)
    it('should add and return device results with a normalized myanmar phone', async () => {
      const { apiKey } = context

      const payload = getCommCarePayload({
        id: '9991',
        resultText: 'positive',
        hcwResult: 'positive',
        age: 28,
        gender: 'male',
      })
      payload.form.phone_number = '123 456-78'
      await server
        .post(pluginPath)
        .auth('commcare_test', apiKey.token)
        .send(payload)
        .then(res => {
          assert.equal(res.status, 200)
          assert.typeOf(res.body, 'Object')
        })
      const { id: deviceId } = await getDeviceFromApiKey(knex, apiKey)

      const result = await getLastResult(knex, deviceId)
      assert.equal(result.id, '9991')
      assert.equal(result.data.resultText, 'positive')
      assert.equal(result.data.hcwConfirmatoryResult, 'positive')
      assert.equal(result.patient.gender, 'male')
      assert.equal(result.patient.phone, '+9512345678')
    })
  })
  describe('admin result updates', () => {
    const context = createTestContext(server, {
      user: 'gates_rdt',
      password: 'gates2018',
      type: 'CommCareApp',
      partner: 'GatesRDT',
      site: 'commcare',
    })
    before(async () => {
      await context.createSites(['commcare'])
      await context.createDeviceApiKey()
      // const { partnerId } = await knex('Partner').first('id as partnerId')
      // const { id: notificationTypeCategoryId } = await knex(
      //   'NotificationTypeCategory'
      // )
      //   .first('id')
      //   .where({ externalId: 'resultBased' })
      // const { id: messageTypeId } = await knex('MessageType as mt')
      //   .join('SmsTemplate as sms', 'mt.smsTemplateId', 'sms.id')
      //   .where(
      //     'sms.message',
      //     'like',
      //     '%Dear participant ID%you re-test in 3 months%'
      //   )
      //   .first('mt.id as id')
      //   console.log('messageTypeId', messageTypeId)
      //   const filterCondition = {
      //   /* result: [
      //     {
      //       assayId: 'CommCareGatesRDT',
      //       resultCategoryId: [
      //         { label: 'Negative', scope: 'ResultCategories', value: 'Success' },
      //         { label: 'Unknown', scope: 'ResultCategories', value: 'Unknown' },
      //       ],
      //     },
      //   ],
      //   areaItems: [
      //     { label: 'Idaho', value: '46' },
      //     { label: 'Nebraska', value: '62' },
      //   ],
      //   jobFunctions: [{ tags: [], checked: true, jobFunctionId: '1' }],
      //   deviceLevelId: 'state', */
      // }
      // const now = new Date()
      // const { id: adminId } = await knex('User').where({ name: 'admin' })

      // const auditFields = {
      //   createdOn: now,
      //   createdBy: adminId,
      //   updatedOn: now,
      //   updatedBy: adminId,
      // }

      // notificationTypeId = await knex('NotificationType').insert({
      //   notificationTypeCategoryId,
      //   partnerId,
      //   jobFunctionId: null,
      //   filterCondition: JSON.stringify(filterCondition),
      //   level: 0,
      //   canAcknowledge: 0,
      //   messageTypeId,
      //   name: 'Result based Notification Type',
      //   sendToContactsWithMatchingTags: 0,
      //   ...auditFields,
      // })
    })
    after(async () => {
      // await knex('Notification')
      //   .where('notificationTypeId', notificationTypeId)
      //   .del()
      // await knex('NotificationType').where('id', notificationTypeId).del()
      context.afterEach()
    })

    it('should add and return device results', async () => {
      const { apiKey } = context

      let payload = getCommCarePayload({
        id: '123',
        resultText: 'negative',
        hcwResult: 'negative',
        age: 28,
        gender: 'male',
      })
      const res = await server
        .post(pluginPath)
        .auth('commcare_test', apiKey.token)
        .send(payload)
      assert.equal(res.status, 200)
      assert.typeOf(res.body, 'Object')

      const { id: deviceId } = await getDeviceFromApiKey(knex, apiKey)

      let result = await getLastResult(knex, deviceId)
      assert.equal(result.id, '123')
      assert.equal(result.data.resultText, 'negative')
      assert.equal(result.data.hcwConfirmatoryResult, 'negative')
      assert.equal(result.patient.gender, 'male')
      assert.equal(result.patient.age, 28)
      let notification = await getLastNotification(knex, deviceId)

      assert.isNotNull(notification)
      assert.equal(result.id, '123')
      assert.equal(result.data.resultText, 'negative')
      assert.equal(result.data.hcwConfirmatoryResult, 'negative')
      assert.equal(result.patient.gender, 'male')
      assert.equal(result.patient.age, 28)
      assert.equal(notification.issueType, 'ResultReceived')
      assert.equal(notification.level, 2)

      assert.equal(
        notification.message,
        'Dear participant ID #study-123: An HIV self-test is a screening test. Please ensure you re-test in 3 months.'
      )

      payload = getCommCarePayload({
        id: '456',
        resultText: 'negative',
        hcwResult: 'positive',
        age: 43,
        gender: 'female',
      })
      payload.form.phone_number = '12345678'
      const res2 = await server
        .post(pluginPath)
        .auth('commcare_test', apiKey.token)
        .send(payload)

      assert.equal(res2.status, 200)
      assert.typeOf(res2.body, 'Object')

      result = await getLastResult(knex, deviceId)
      notification = await getLastNotification(knex, deviceId)
      assert.equal(result.id, '456')
      assert.equal(result.data.resultText, 'negative')
      assert.equal(result.data.hcwConfirmatoryResult, 'positive')
      assert.equal(result.patient.gender, 'female')
      assert.equal(result.patient.phone, '+112345678')
      assert.equal(result.patient.age, 43)
      assert.equal(notification.issueType, 'ResultReceived')
      assert.equal(notification.level, 3)
      assert.equal(
        notification.message,
        'Dear participant ID #study-456: An HIV self-test is a screening test. Please visit your nearest clinic as your test MUST be confirmed by a healthcare worker as soon as possible'
      )

      payload = getCommCarePayload({
        id: '821',
        resultText: 'negative',
        hcwResult: 'positive',
        hcwTiebreakResult: 'negative',
        age: 30,
        gender: 'male',
      })
      const res3 = await server
        .post(pluginPath)
        .auth('commcare_test', apiKey.token)
        .send(payload)

      assert.equal(res3.status, 200)
      assert.typeOf(res3.body, 'Object')

      result = await getLastResult(knex, deviceId)
      assert.equal(result.id, '821')
      assert.equal(result.data.resultText, 'negative')
      assert.equal(result.data.hcwConfirmatoryResult, 'positive')
      assert.equal(result.data.hcwTiebreakerResult, 'negative')
      assert.equal(result.patient.gender, 'male')
      assert.equal(result.patient.age, 30)
      notification = await getLastNotification(knex, deviceId)
      assert.equal(notification.issueType, 'ResultReceived')
      assert.equal(notification.level, 2)

      assert.equal(
        notification.message,
        'Dear participant ID #study-821: An HIV self-test is a screening test. Please ensure you re-test in 3 months.'
      )
    })
  })
})
async function getLastNotification(knex, deviceId) {
  const resultId = await getLastResultId(knex, deviceId)
  await waitForIdle()
  const notification = await knex('Notification as n')
    .join('Issue as i', 'i.id', 'n.issueId')
    .join('IssueType as it', 'it.id', 'i.issueTypeId')
    .join('SmsMessage as s', 'n.smsMessageId', 's.id')
    .where('i.resultId', resultId)
    .orderBy('i.id', 'desc')
    .first('it.externalId as issueType', 'i.level', 's.message')
  return notification
}
