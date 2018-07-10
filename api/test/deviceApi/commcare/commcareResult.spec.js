const supertest = require('supertest')
const config = require('../../../src/config')
const chai = require('chai')
const {
  createTestContext,
  getDeviceFromApiKey,
  getLastResultId,
} = require('../utils')
const { waitForIdle } = require('../../utils/mqUtils')
const { getResult } = require('../../../src/deviceApi/result')

const server = supertest.agent('http://localhost:8080')
const { assert } = chai

const pluginPath = '/device/plugin/commcare'

describe('CommCare Result API routes', () => {
  describe('admin result updates', () => {
    const context = createTestContext(server, {
      user: 'gates_rdt',
      password: 'gates2018',
      type: 'CommCareApp',
      partner: 'GatesRDT',
      site: 'commcare',
    })

    const { runTest } = context

    beforeEach(context.beforeEach)
    afterEach(context.afterEach)

    it('should add and return device results', () =>
      runTest(async knex => {
        const { apiKey } = context

        let payload = getCommCarePayload({
          id: '123',
          resultText: 'negative',
          hcwResult: 'negative',
          age: 28,
          gender: 'male',
        })
        await server
          .post(pluginPath)
          .auth('commcare_test', apiKey.token)
          .send(payload)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })
        const { id: deviceId } = await getDeviceFromApiKey(knex, apiKey)

        let result = await getLastResult(knex, deviceId)
        let notification = await getLastNotification(knex, deviceId)
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
        await server
          .post(pluginPath)
          .auth('commcare_test', apiKey.token)
          .send(payload)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        result = await getLastResult(knex, deviceId)
        notification = await getLastNotification(knex, deviceId)
        assert.equal(result.id, '456')
        assert.equal(result.data.resultText, 'negative')
        assert.equal(result.data.hcwConfirmatoryResult, 'positive')
        assert.equal(result.patient.gender, 'female')
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
        await server
          .post(pluginPath)
          .auth('commcare_test', apiKey.token)
          .send(payload)
          .then(res => {
            assert.equal(res.status, 200)
            assert.typeOf(res.body, 'Object')
          })

        result = await getLastResult(knex, deviceId)
        notification = await getLastNotification(knex, deviceId)
        assert.equal(result.id, '821')
        assert.equal(result.data.resultText, 'negative')
        assert.equal(result.data.hcwConfirmatoryResult, 'positive')
        assert.equal(result.data.hcwTiebreakerResult, 'negative')
        assert.equal(result.patient.gender, 'male')
        assert.equal(result.patient.age, 30)
        assert.equal(notification.issueType, 'ResultReceived')
        assert.equal(notification.level, 2)
        assert.equal(
          notification.message,
          'Dear participant ID #study-821: An HIV self-test is a screening test. Please ensure you re-test in 3 months.'
        )
      }))
  })
})

async function getLastResult(knex, deviceId) {
  const resultId = await getLastResultId(knex, deviceId)
  return getResult(knex, resultId)
}

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

function getCommCarePayload({
  id = '422',
  resultText = 'positive',
  hcwResult = 'positive',
  hcwTiebreakResult = 'not_needed',
  age = '32',
  gender = 'male',
}) {
  return {
    app_id: '3f69970af4258aee673c6348cd3a395e',
    archived: false,
    attachments: {
      '1528890813120.jpg': {
        content_type: 'image/jpeg',
        length: 302162,
        url:
          'https://www.commcarehq.org/a/testproject-24/api/form/attachment/cb4f3814-1304-4b7a-ba61-39cd7c0bd3c6/1528890813120.jpg',
      },
      'form.xml': {
        content_type: 'text/xml',
        length: 1570,
        url:
          'https://www.commcarehq.org/a/testproject-24/api/form/attachment/cb4f3814-1304-4b7a-ba61-39cd7c0bd3c6/form.xml',
      },
    },
    build_id: 'ecf92eccb64d48d583843c7cf8cc6a1c',
    domain: 'testproject-24',
    edited_by_user_id: null,
    edited_on: null,
    form: {
      '#type': 'data',
      '@name': 'RDT Assay',
      '@uiVersion': '1',
      '@version': '112',
      '@xmlns':
        'http://openrosa.org/formdesigner/BEC9A305-4674-4FE7-B4C6-8779CCB7C5A5',
      age,
      education_level: '8_to_matriculation',
      gender,
      hcw_confirmatory_result: hcwResult,
      hcw_rdt_result: resultText,
      hcw_tiebreak_result: hcwTiebreakResult,
      ignore0: 'OK',
      ignore1: 'OK',
      ignore10: 'OK',
      ignore11: 'OK',
      ignore12: 'OK',
      ignore2: 'OK',
      ignore3: 'OK',
      ignore4: 'OK',
      ignore5: 'OK',
      ignore6: 'OK',
      ignore7: 'OK',
      ignore8: 'OK',
      ignore9: 'OK',
      meta: {
        '@xmlns': 'http://openrosa.org/jr/xforms',
        appVersion:
          'CommCare Android, version "2.43.1"(450535). App v112. CommCare Version 2.43. Build 450535, built on: 2018-05-08',
        app_build_version: 112,
        commcare_version: '2.43.1',
        deviceID: '354503092791107',
        geo_point: null,
        instanceID: 'cb4f3814-1304-4b7a-ba61-39cd7c0bd3c6',
        location: {
          '#text': '-36.147054247558117 87.925519002601504 1620.0 15.0',
          '@xmlns': 'http://commcarehq.org/xforms',
        },
        timeEnd: '2018-06-13T11:53:51.609000Z',
        timeStart: '2018-06-13T11:52:34.951000Z',
        userID: 'f7d6a38e36474c57be6c9e31c93c0dce',
        username: 'testuser',
      },
      phone_number: config.admin.cell,
      previous_testing: 'yes',
      rdt_picture: '1528890813120.jpg',
      rdt_result: resultText,
      study_id: `study-${id}`,
    },
    id,
    initial_processing_complete: true,
    is_phone_submission: true,
    metadata: {
      appVersion:
        'CommCare Android, version "2.43.1"(450535). App v112. CommCare Version 2.43. Build 450535, built on: 2018-05-08',
      app_build_version: 112,
      commcare_version: '2.43.1',
      deviceID: '354503092791107',
      geo_point: null,
      instanceID: 'cb4f3814-1304-4b7a-ba61-39cd7c0bd3c6',
      location: '-36.147054247558117 87.925519002601504 1620.0 15.0',
      timeEnd: '2018-06-13T11:53:51.609000Z',
      timeStart: '2018-06-13T11:52:34.951000Z',
      userID: 'f7d6a38e36474c57be6c9e31c93c0dce',
      username: 'testuser',
    },
    problem: null,
    received_on: '2018-06-13T11:53:59.330659Z',
    resource_uri: '',
    server_modified_on: '2018-06-13T11:54:00.628095Z',
    type: 'data',
    uiversion: '1',
    version: '112',
  }
}
