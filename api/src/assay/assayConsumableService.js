const _ = require('lodash')
const Boom = require('boom')
const { query } = require('../db')

const SELECT_LIST_FIELDS = ['ca.consumableId', 'ca.assayId', 'ca.quantity']

function getAssayConsumable(assayId, consumableId) {
  return query('Get assay consumable')
    .from('ConsumableAssay as ca')
    .where('ca.assayId', assayId)
    .andWhere('ca.consumableId', consumableId)
    .first(SELECT_LIST_FIELDS)
}

function* getAssayConsumables(request){
  const {assayId} = request.params

  const assayConsumables = yield query('Get assay consumables')
    .from('ConsumableAssay as ca')
    .where('ca.assayId', assayId)
    .select(SELECT_LIST_FIELDS)

  return {ok: true, data: assayConsumables }
}

function* createAssayConsumable(request) {
  const {assayId, consumableId, quantity} = request.payload

  yield query('Insert assay consumable')
    .insert({assayId, consumableId, quantity})
    .into('ConsumableAssay')

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
  getAssayConsumables,
  createAssayConsumable,
  updateAssayConsumableQuantity,
  deleteAssayConsumable
}
