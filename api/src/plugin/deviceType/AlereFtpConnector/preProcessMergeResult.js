const _ = require('lodash')
const Boom = require('boom')
const differenceInHours = require('date-fns/difference_in_hours')
const { getDateOrDefault } = require('../../../shared/date')
const { createUniqueIdForResult } = require('../../../result/service')

async function preProcessMergeResult({ knex, deviceId, payload, now }) {
  if (!deviceId) {
    throw Boom.notFound('Cannot find device')
  }
  const [device] = await knex
    .from('Device as d')
    .where({ 'd.id': deviceId })
    .select('d.id', 'd.siteId', 'd.partnerId', 'd.deviceTypeId')
  if (_.isEmpty(device)) {
    throw Boom.notFound(`Cannot find device ${deviceId}`)
  }
  const instrumentSerial = _.get(payload, 'instrument.serial', null)
  const startedOn = getDateOrDefault(payload, 'startedOn', null)
  if (!startedOn) {
    throw Boom.badRequest(
      'Start date is required for a result from an Alere device'
    )
  }
  const sampleId = _.get(payload, 'sample.id', null)
  const resultExternalId = createUniqueIdForResult(
    instrumentSerial,
    startedOn,
    startedOn,
    sampleId
  )
  payload.id = resultExternalId

  const existingResult = await knex
    .from('Result as r')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .where({
      'r.deviceId': deviceId,
      'r.externalId': resultExternalId,
    })
    .first(
      'r.id',
      'r.externalId',
      'r.endedOn',
      'r.resultData',
      'rc1.externalId as resultCategory1',
      'rc2.externalId as resultCategory2'
    )

  if (existingResult) {
    // Are we setting this result to NO RESULT?
    if (
      !_.isEmpty(_.get(payload, 'category', [])) &&
      _.every(_.get(payload, 'category'), { id: 'NoResult' })
    ) {
      // Has the result already been determined?
      if (
        _.get(existingResult, 'resultCategory1') !== 'NoResult' ||
        _.get(existingResult, 'resultCategory2') !== 'NoResult'
      ) {
        // We should never merge an incomplete result over a complete result
        throw Boom.conflict('A later version of this result already exists')
      }
    }
    const pickedUpOn = getDateOrDefault(payload, 'data.pickedUpOn', null)
    if (pickedUpOn) {
      const existingResultEndedOn = getDateOrDefault(payload, 'endedOn', now)
      if (
        (existingResultEndedOn === startedOn ||
          existingResultEndedOn > pickedUpOn) &&
        differenceInHours(existingResultEndedOn, pickedUpOn) <= 5
      ) {
        payload.endedOn = pickedUpOn
      } else if (!_.get(payload, 'endedOn')) {
        payload.endedOn = startedOn
      }
    }
  }
}

module.exports = preProcessMergeResult
