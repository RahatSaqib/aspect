const _ = require('lodash')
const Boom = require('@hapi/boom')
const { getConstraints } = require('../../../auth/constraints')
const { fieldNameToFollowUpTypeIdMappings, NOT_POSSIBLE_FOLLOW_UP_TYPE } = require('../../result/common/logic')
const { getFollowUps } = require('./db')

const getFollowUpsForUser = async (request, followUpTypeExternalId) => {
  const {
    auth: { credentials },
  } = request
  const dataConstraints = await getConstraints(credentials)
  return getFollowUps(followUpTypeExternalId, dataConstraints)
}

const normalizeFollowUpTypes = denormalizedFollowUpRecords =>
  _.uniq(denormalizedFollowUpRecords.map(fu => fu.id)).map(fuId => {
    const followUpRecords = denormalizedFollowUpRecords.filter(fu => fu.id === fuId)
    return {
      id: fuId,
      name: followUpRecords[0].name,
      i18nKey: followUpRecords[0].i18nKey,
      assays: _.uniq(followUpRecords.map(fur => fur.assayExternalId)),
    }
  })

async function fetchTreatmentFollowUpsServiceHandler(request) {
  const treatmentFollowUps = await getFollowUpsForUser(request, fieldNameToFollowUpTypeIdMappings.treatment)
  if (_.isEmpty(treatmentFollowUps)) {
    throw Boom.notFound('Treatments not found')
  }
  return {
    ok: true,
    data: normalizeFollowUpTypes(treatmentFollowUps.filter(tfu => tfu.id !== NOT_POSSIBLE_FOLLOW_UP_TYPE)),
  }
}

async function fetchOutcomeFollowUpsServiceHandler(request) {
  const outcomeFollowUps = await getFollowUpsForUser(request, fieldNameToFollowUpTypeIdMappings.outcome)
  if (_.isEmpty(outcomeFollowUps)) {
    throw Boom.notFound('Outcomes not found')
  }
  return { ok: true, data: normalizeFollowUpTypes(outcomeFollowUps) }
}

module.exports = { fetchTreatmentFollowUpsServiceHandler, fetchOutcomeFollowUpsServiceHandler }
