const _ = require('lodash')
const Boom = require('boom')
const { createUniqueIdForResult } = require('../../../result/service')
const { findExistingResult } = require('./result')

/*
The purpose of this plugin is to ensure that results are captured
even when the assay name in the result is unknown to Aspect
If the device is unknown, ignore this request
If an unknown assay is detected, create it
*/
async function preProcessMergeResult({ knex, deviceId, payload }) {
  if (!deviceId) {
    throw Boom.notFound('Cannot find device')
  }
  const startedOn = _.get(payload, 'startedOn') || _.get(payload, 'endedOn')
  const endedOn = _.get(payload, 'endedOn') || startedOn
  if (!startedOn) {
    throw Boom.badRequest(
      'Start date or end date is required for a result from GxConnect'
    )
  }
  const [device] = await knex
    .from('Device as d')
    .where({ 'd.id': deviceId })
    .select('d.id', 'd.siteId', 'd.partnerId', 'd.deviceTypeId')
  if (_.isEmpty(device)) {
    throw Boom.notFound(`Cannot find device ${deviceId}`)
  }
  if (!_.isEmpty(payload.data)) {
    payload.category = getResultCategories(payload)
  } else {
    payload.data = {}
  }
  const instrumentSerial = _.get(payload, 'instrument.serial', null)
  const cartridgeSerial = _.get(payload, 'consumable[0].serial', null)
  const sampleId = _.get(payload, 'sample.id')

  if (payload.id) {
    payload.data.geneXpertTestId = payload.id
  }
  const generatedExternalId = createUniqueIdForResult(
    instrumentSerial,
    startedOn,
    endedOn,
    sampleId
  )
  const gxAlertUniqueId = _.get(
    payload,
    'data.gxAlertTestUniqueId',
    generatedExternalId
  )
  const geneXpertTestId = _.get(payload, 'id') || _.get(payload, 'data.id')
  const existingResult = await findExistingResult(
    {
      partnerId: device.partnerId,
      geneXpertTestId,
      gxAlertUniqueId,
      cartridgeSerial,
      instrumentSerial,
    },
    knex
  )
  if (!existingResult) {
    // Only assign assay to GxUnknown if result is new
    await assignGxUnknownAssayIfNotExists(knex, payload)
  } else if (_.get(existingResult, 'externalId') !== generatedExternalId) {
    await knex('Result')
      .where('id', existingResult.id)
      .update({ externalId: generatedExternalId })
  }
  payload.id = generatedExternalId
}

async function assignGxUnknownAssayIfNotExists(knex, payload) {
  const payloadAssayId = _.get(payload, 'assay.id', false)
  const assay = await knex
    .from('Assay as a')
    .where({ 'a.externalId': payloadAssayId })
    .first('a.externalId')
  if (_.isEmpty(assay)) {
    _.set(payload, 'assay.id', 'GxUnknown')
  }
}

function getResultCategories(payload) {
  let payloadCategory = _.get(payload, 'category')
  if (_.isEmpty(payloadCategory)) {
    payloadCategory = []
    const payloadResultText = _.get(payload, 'data.resultText')
    if (payloadResultText) {
      const resultTextValues = _.compact(payloadResultText.split('|'))
      if (resultTextValues.length > 0) {
        const result1Text = resultTextValues[0]
          .toLowerCase()
          .replace(/mtb/, '')
          .replace(/ebola gp/, '')
          .trim()
        const result1CategoryMapping = {
          'not detected': 'NotDetected',
          'não detectado': 'NotDetected',
          'не обнаружен': 'NotDetected',
          'non détecté': 'NotDetected',
          'no detectado': 'NotDetected',
          detected: 'Detected',
          'detected very low': 'Detected',
          'detected low': 'Detected',
          'detected medium': 'Detected',
          'detected high': 'Detected',
          detectado: 'Detected',
          'detectado alto': 'Detected',
          'detectado médio': 'Detected',
          'detectado baixo': 'Detected',
          'detectado muito baixo': 'Detected',
          обнаружен: 'Detected',
          'обнаружен очень низкий': 'Detected',
          'обнаружен низкий': 'Detected',
          'обнаружен средний': 'Detected',
          'обнаружен высокий': 'Detected',
          détecté: 'Detected',
          'détecté très bas': 'Detected',
          'détecté bas': 'Detected',
          'détecté moyen': 'Detected',
          'détecté élevé': 'Detected',
          'detectado muy bajo': 'Detected',
          'detectado bajo': 'Detected',
          'detectado medio': 'Detected',
          invalid: 'Invalid',
          inválido: 'Invalid',
          недействительный: 'Invalid',
          'non valide': 'Invalid',
          'no result': 'NoResult',
          'sem resultado': 'NoResult',
          безрезультатно: 'NoResult',
          'sans résultat': 'NoResult',
          'sin resultado': 'NoResult',
          error: 'Error',
          erro: 'Error',
          ошибка: 'Error',
          erreur: 'Error',
          'trace detected': 'Detected',
          'null null': 'Success',
        }
        if (result1CategoryMapping[result1Text]) {
          payloadCategory = [{ id: result1CategoryMapping[result1Text] }]
        }
      }
      const result1 = _.isEmpty(payloadCategory) ? null : payloadCategory[0].id
      const canHaveSecondResult =
        ['Detected', 'Error', 'Invalid', 'NoResult', 'Success'].includes(
          result1
        ) ||
        !_.includes(['GxMtbRif', 'GxMtbRifUltra'], _.get(payload, 'assay.id'))

      if (resultTextValues.length > 1) {
        const result2Text = resultTextValues[1]
          .toLowerCase()
          .replace(/rif resistance/, '')
          .replace(/ebola np/, '')
          .trim()
        if (canHaveSecondResult) {
          const result2CategoryMapping = {
            'not detected': 'NotDetected',
            'não detectado': 'NotDetected',
            'не обнаружен': 'NotDetected',
            'non détecté': 'NotDetected',
            'no detectado': 'NotDetected',
            detected: 'Detected',
            detectado: 'Detected',
            обнаружен: 'Detected',
            détecté: 'Detected',
            indeterminate: 'Indeterminate',
            indeterminado: 'Indeterminate',
            неопределенный: 'Indeterminate',
            indéterminé: 'Indeterminate',
            error: 'Error',
            invalid: 'Invalid',
            'no result': 'NoResult',
          }
          if (result2CategoryMapping[result2Text]) {
            payloadCategory = [
              ...payloadCategory,
              { id: result2CategoryMapping[result2Text] },
            ]
          }
        }
      } else if (
        canHaveSecondResult &&
        ['Error', 'Invalid', 'NoResult'].includes(result1)
      ) {
        payloadCategory = [...payloadCategory, { id: result1 }]
      }
    }
  }
  return payloadCategory
}

module.exports = preProcessMergeResult
