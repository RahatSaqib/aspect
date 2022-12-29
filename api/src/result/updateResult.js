const { Boom } = require('@hapi/boom')
const { getUser } = require('../auth/service')
const { getResultByResultId } = require('./common/db')
const { resultUpdated } = require('./actions')
const { knex } = require('../db')

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
  })
  if (!result.ok) {
    return Boom.notFound('This result does not exist or you do not have access.')
  }

  const user = await getUser(auth.credentials.name)
  const { id: userId } = user
  const now = new Date()
  const { customFields } = result.data

  const simpleFieldsToUpdate = {}
  const jsonFieldsToUpdate = {}
  for (const customField of customFields) {
    const isSimpleField = !customField.source.includes('.')

    if (isSimpleField) {
      const key = customField.source
      simpleFieldsToUpdate[key] = payload[key] || ''
    } else {
      const [parent, key] = customField.source.split('.')
      jsonFieldsToUpdate[parent] = jsonFieldsToUpdate[parent] || {}
      jsonFieldsToUpdate[parent][key] = payload[parent][key] || ''
    }
  }

  await knex('Result')
    .where('id', resultId)
    .update({
      ...simpleFieldsToUpdate,
      ...Object.fromEntries(
        Object.keys(jsonFieldsToUpdate).map(key => {
          const fields = jsonFieldsToUpdate[key]
          const stringFields = Object.keys(fields)
            .map(current => {
              return `'$.${current}','${fields[current]}'`
            })
            .join(',')
          return [key, knex.raw(`JSON_SET(${key}, ${stringFields})`)]
        })
      ),
      updatedBy: userId,
      updatedOn: now,
    })

  messageContext.bindActionCreators({ resultUpdated })
  messageContext.resultUpdated(result.data.id)

  return { ok: true, data: result.data }
}

module.exports = {
  updateResult,
}
