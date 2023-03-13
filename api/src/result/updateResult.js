const { Boom } = require('@hapi/boom')
const _ = require('lodash')
const { getUser } = require('../auth/service')
const { getResultByResultId } = require('./common/db')
const { resultUpdated } = require('./actions')
const { knex } = require('../db')
const { getRemoteAddress } = require('../shared/request')

async function updateResult(request) {
  const {
    params: { resultId },
    auth,
    payload,
    plugins: { messageContext },
  } = request

  const result = await getResultByResultId(auth, resultId, {
    id: 'r.id',
    siteId: 'r.siteId',
    assayId: 'r.assayId',
    deviceId: 'r.deviceId',
    sampleId: 'r.sampleId',
    partnerId: 'r.partnerId',
    resultCategory1: 'r.resultCategory1',
    resultCategory2: 'r.resultCategory2',
    endedOn: 'r.endedOn',
    resultSourceExternalId: 'rso.externalId',
    patientData: 'r.patientData',
    resultData: 'r.resultData',
    resultTypeId: 'r.resultTypeId',
  })
  if (!result.ok) {
    return Boom.notFound('This result does not exist or you do not have access.')
  }

  const user = await getUser(auth.credentials.name)
  const { id: userId } = user
  const now = new Date()
  const { customFields, deviceId } = result.data

  let fieldsToUpdate = {}
  for (const customField of customFields) {
    if (customField.source) {
      _.set(fieldsToUpdate, customField.source, _.get(payload, customField.source))
    }
  }
  const deviceLogRawMessage = JSON.stringify({
    auth: { credentials: { name: auth.credentials.name } },
    payload: fieldsToUpdate,
  })

  /**
   * stringify values of fields with value of object in which case
   * we deal with JSON fields (i.e. resultData, patientData)
   */
  fieldsToUpdate = _.reduce(
    _.keys(fieldsToUpdate),
    (acc, fieldName) => {
      const value = fieldsToUpdate[fieldName]
      if (_.isPlainObject(value)) {
        /**
         * notice that we are here dealing with custom fields defined as
         * "source": "patientData.XXXX" or
         * "source": "resultData.XXXX"
         * In this case we need to use corresponding actual data from db
         * (Result.patientData or Result.resultData) JSON fields, and merge them with
         * current `value` and save back as stringified JSON.
         * Such merge with original value from db is needed because we may have not all
         * props from `patientData` or `resultData` used in custom fields, and
         * because of that we can not overwrite them with incomplete set from
         * received payload of edited custom fields.
         */
        const valueFromDb = result.data[fieldName]
        /**
         * ^^^ `valueFromDb` is JSON field, because we do JSON.parse for `patientData` or
         * `resultData` in getResultByResultId func
         */
        const newValue = {
          ...valueFromDb,
          ...value,
        }
        acc[fieldName] = JSON.stringify(newValue)
      } else {
        acc[fieldName] = value
      }
      return acc
    },
    {}
  )

  if (payload.resultTypeId && payload.resultTypeId !== result.resultTypeId) {
    fieldsToUpdate.resultTypeId = payload.resultTypeId
  }

  await knex('Result')
    .where('id', resultId)
    .update({
      ...fieldsToUpdate,
      updatedBy: userId,
      updatedOn: now,
    })

  let deviceLogId
  if (deviceId) {
    const senderIp = getRemoteAddress(request)
    ;[deviceLogId] = await knex('DeviceLog').insert({
      deviceId,
      resultId,
      source: 'Custom Fields Edited in Aspect',
      createdOn: now,
      senderIp,
      rawMessage: deviceLogRawMessage,
    })
  }

  messageContext.bindActionCreators({ resultUpdated })
  messageContext.resultUpdated(resultId, deviceLogId, userId)

  return { ok: true, data: { id: result.data.id } }
}

module.exports = {
  updateResult,
}
