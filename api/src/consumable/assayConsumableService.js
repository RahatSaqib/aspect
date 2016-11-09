const _ = require('lodash')
const Boom = require('boom')
const { query } = require('../db')

const SELECT_LIST_FIELDS = ['ca.consumableId', 'ca.assayId', 'ca.quantity',
  'c.name as consumableName', 'u.name as unitName', 'u.shortname as unitShortName',
  'a.name as assayName', 'a.i18nKey as assayI18nKey']

function* getConsumableAssays(request){
  const {consumableId} = request.params

  const assayConsumables = yield query('Get assay consumables')
    .from('ConsumableAssay as ca')
    .join('Consumable as c', 'ca.consumableId', 'c.id')
    .join('Unit as u', 'c.unit', 'u.id')
    .join('Assay as a', 'ca.assayId', 'a.id')
    .where('ca.consumableId', consumableId)
    .select(SELECT_LIST_FIELDS)

  return {ok: true, data: assayConsumables }
}

function getAssayConsumable(assayId, consumableId) {
  return query('Get assay consumable')
    .from('ConsumableAssay as ca')
    .join('Consumable as c', 'ca.consumableId', 'c.id')
    .join('Unit as u', 'c.unit', 'u.id')
    .join('Assay as a', 'ca.assayId', 'a.id')
    .where('ca.assayId', assayId)
    .andWhere('ca.consumableId', consumableId)
    .first(SELECT_LIST_FIELDS)
}

function* getAssayConsumables(request){
  const {assayId} = request.params

  const assayConsumables = yield query('Get assay consumables')
    .from('ConsumableAssay as ca')
    .join('Consumable as c', 'ca.consumableId', 'c.id')
    .join('Unit as u', 'c.unit', 'u.id')
    .join('Assay as a', 'ca.assayId', 'a.id')
    .where('ca.assayId', assayId)
    .select(SELECT_LIST_FIELDS)

  return {ok: true, data: assayConsumables }
}

function* createAssayConsumable(request) {
  const {assayId, consumableId, quantity} = request.payload

  try {
    yield query('Insert assay consumable')
      .insert({assayId, consumableId, quantity})
      .into('ConsumableAssay')
  } catch (err) {
    if(err.code === 'ER_DUP_ENTRY') {
      return Boom.conflict('There is already an record for this assay and consumable')
    }
    throw err
  }

  const assayConsumable = yield getAssayConsumable(assayId, consumableId)

  return { ok: true, data: assayConsumable }
}

function* updateAssayConsumableQuantity(request) {
  const {params: {assayId, consumableId}, payload: {quantity}} = request

  yield query('Update assay consumable')
    .from('ConsumableAssay as ca')
    .where('ca.assayId', assayId)
    .andWhere('ca.consumableId', consumableId)
    .update({'ca.quantity': quantity})

  const assayConsumable = yield getAssayConsumable(assayId, consumableId)

  if(_.isEmpty(assayConsumable)) {
    return Boom.notFound('Assay consumable not found')
  }

  return { ok: true, data: assayConsumable }
}

function* deleteAssayConsumable(request) {
  const {assayId, consumableId} = request.params

  yield query('Delete assay consumable')
    .from('ConsumableAssay')
    .where('assayId', assayId)
    .andWhere('consumableId', consumableId)
    .delete()

  return { ok: true }
}

module.exports = {
  getConsumableAssays,
  getAssayConsumables,
  createAssayConsumable,
  updateAssayConsumableQuantity,
  deleteAssayConsumable
}
