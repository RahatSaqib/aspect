const _ = require('lodash')
const Boom = require('boom')
/*
The purpose of this plugin is to ensure that results are captured
even when the assay name in the result is unknown to Aspect
If the device is unknown, ignore this request
If an unknown assay is detected, create it
*/
function* preProcessMergeResult({ knex, deviceId, payload }) {
  if (!deviceId) {
    throw Boom.notFound('Cannot find device')
  }
  const device = yield knex
    .from('Device as d')
    .where({ 'd.id': deviceId })
    .select('d.id', 'd.siteId', 'd.deviceTypeId')
    .first()
  if (_.isEmpty(device)) {
    throw Boom.notFound(`Cannot find device ${deviceId}`)
  }
  yield* createAssayIfNotExists(knex, device, payload)
  if (!_.isEmpty(payload.data)) {
    payload.category = getResultCategories(payload)
  }
}

function* createAssayIfNotExists(knex, device, payload) {
  const payloadAssayId = _.get(payload, 'assay.id', false)
  const assay = yield knex
    .from('Assay as a')
    .where({ 'a.externalId': payloadAssayId })
    .select('a.id')
    .first()
  if (_.isEmpty(assay)) {
    const unknownAssayType = yield knex
      .from('AssayType as at')
      .where({ 'at.name': 'Unknown' })
      .select('at.id')
      .first()
    if (!_.isEmpty(unknownAssayType)) {
      const resultSourceExternalId =
        _.get(payload, 'source.id') || 'DiagnosticDevice'
      const resultSource = knex
        .from('ResultSource as rs')
        .where({ 'rs.externalid': resultSourceExternalId })
        .select('rs.id')
        .first()
      if (!_.isEmpty(resultSource)) {
        if (device.deviceTypeId) {
          yield knex
            .insert({
              name: payloadAssayId,
              externalId: payloadAssayId,
              assayTypeId: unknownAssayType.id,
              deviceTypeId: device.deviceTypeId,
              resultSourceId: resultSource.id,
            })
            .into('Assay')
        } else {
          throw Boom.notFound(
            'Cannot find device type for this result, please ensure that the Device API key is linked to an actual device or type has been specified in this request'
          )
        }
      } else {
        throw Boom.notFound(
          'Cannot determine the type of result source for a new assay no diagnostic device result source exists.'
        )
      }
    } else {
      throw Boom.notFound(
        'Cannot determine the type of assay for this result and no unknown assay type exists.'
      )
    }
  }
}

function getResultCategories(payload) {
  let payloadCategory = _.get(payload, 'category')
  if (_.isEmpty(payloadCategory)) {
    payloadCategory = []
    const payloadResultText = _.get(payload, 'data.ResultText')
    if (payloadResultText) {
      const resultTextValues = payloadResultText.split('|')
      if (resultTextValues.length > 0) {
        const result1Text = resultTextValues[0]
          .toLowerCase()
          .replace(/mtb/, '')
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
        }
        if (result1CategoryMapping[result1Text]) {
          payloadCategory = [{ id: result1CategoryMapping[result1Text] }]
        }
      }
      const mtbResult = _.isEmpty(payloadCategory)
        ? null
        : payloadCategory[0].id
      if (resultTextValues.length > 1) {
        const result2Text = resultTextValues[1]
          .toLowerCase()
          .replace(/rif resistance/, '')
          .trim()
        if (mtbResult === 'Detected') {
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
          }
          if (result2CategoryMapping[result2Text]) {
            payloadCategory = [
              ...payloadCategory,
              { id: result2CategoryMapping[result2Text] },
            ]
          }
        }
      } else if (mtbResult === 'Detected') {
        payloadCategory = [...payloadCategory, { id: 'Indeterminate' }]
      }
    }
  }
  return payloadCategory
}

module.exports = preProcessMergeResult
