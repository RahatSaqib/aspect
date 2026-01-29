const _ = require('lodash')
const Boom = require('@hapi/boom')
const { getUser } = require('../../auth/service')
const { getConstraints } = require('../../auth/constraints')
const { getSite } = require('../../site/service')
const { knex } = require('../../db')

/**
 * Upsert custom fields into FormData: update existing row when same siteId, sampleExternalId
 * and formDefinitionExternalId exist, otherwise insert.
 */
async function upsertCustomFields(request) {
  const { payload, auth } = request
  const currentlyLoggedInUser = await getUser(auth.credentials.name)
  const dataConstraints = await getConstraints(auth.credentials)
  const site = await getSite(payload.originSiteId, dataConstraints)
  if (_.isEmpty(site)) {
    throw Boom.forbidden('Unauthorised Origin Site')
  }

  const collectedOnRaw = new Date(payload?.collectedOn ?? '')
  const collectedOn = _.isNaN(collectedOnRaw.getTime()) ? null : collectedOnRaw

  const siteId = payload.originSiteId
  const sampleExternalId = payload.sampleExternalId ?? null
  const now = new Date()

  await knex.transaction(async trx => {
    const existingRows = await trx('FormData').where({ siteId, sampleExternalId }).select('id', 'data')

    const existingByFormDefId = new Map()
    for (const row of existingRows) {
      const data = typeof row.data === 'string' ? JSON.parse(row.data) : row.data
      const formDefId = data?.formDefinitionExternalId
      if (formDefId) {
        existingByFormDefId.set(formDefId, { id: row.id, data })
      }
    }

    const operations = payload.customFieldsData.map(item => {
      const { formDefinitionExternalId } = item
      const data = { formDefinitionExternalId, fields: item.fields ?? {} }
      const existing = existingByFormDefId.get(formDefinitionExternalId)

      if (existing) {
        return trx('FormData').where('id', existing.id).update({
          data,
          collectedOn,
          updatedOn: now,
          updatedBy: currentlyLoggedInUser.id,
        })
      }
      return trx('FormData').insert({
        siteId,
        resultId: null,
        sampleExternalId,
        data,
        collectedOn,
        createdOn: now,
        createdBy: currentlyLoggedInUser.id,
        updatedOn: now,
        updatedBy: currentlyLoggedInUser.id,
      })
    })
    await Promise.all(operations)
  })

  return { ok: true }
}

module.exports = { upsertCustomFields }
