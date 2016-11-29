const _ = require('lodash')
const Boom = require('boom')
const {
  getConstraints
} = require('../auth/constraints')
const { query } = require('../db')

const SELECT_LIST_FIELDS = ['ca.consumableId', 'ca.assayId', 'ca.quantity',
  'c.name as consumableName', 'u.name as unitName', 'u.shortname as unitShortName',
  'a.name as assayName', 'a.i18nKey as assayI18nKey']

function* getConsumableAssays(request) {
  const { auth, params: { consumableId } } = request

  const dataConstraints = yield getConstraints(auth.credentials)

  const assayConsumables = yield query('Get assay consumables')
    .from('ConsumableAssay as ca')
    .join('Consumable as c', 'ca.consumableId', 'c.id')
    .join('Unit as u', 'c.unit', 'u.id')
    .join('Assay as a', 'ca.assayId', 'a.id')
    .where('ca.consumableId', consumableId)
    .andWhere(function () {
      this.whereNull('c.partnerId')
        .orWhere({ 'c.partnerId': dataConstraints.partner.id })
    })
    .select(SELECT_LIST_FIELDS)

  return { ok: true, data: assayConsumables }
}

function getAssayConsumable(partnerId, assayId, consumableId) {
  return query('Get assay consumable')
    .from('ConsumableAssay as ca')
    .join('Consumable as c', 'ca.consumableId', 'c.id')
    .join('Unit as u', 'c.unit', 'u.id')
    .join('Assay as a', 'ca.assayId', 'a.id')
    .where('ca.assayId', assayId)
    .andWhere('ca.consumableId', consumableId)
    .andWhere(function () {
      this.whereNull('c.partnerId')
        .orWhere({ 'c.partnerId': partnerId })
    })
    .first(SELECT_LIST_FIELDS)
}

function* getAssayConsumables(request) {
  const { auth, params: { assayId } } = request

  const dataConstraints = yield getConstraints(auth.credentials)

  const assayConsumables = yield query('Get assay consumables')
    .from('ConsumableAssay as ca')
    .join('Consumable as c', 'ca.consumableId', 'c.id')
    .join('Unit as u', 'c.unit', 'u.id')
    .join('Assay as a', 'ca.assayId', 'a.id')
    .where('ca.assayId', assayId)
    .andWhere(function () {
      this.whereNull('c.partnerId')
        .orWhere({ 'c.partnerId': dataConstraints.partner.id })
    })
    .select(SELECT_LIST_FIELDS)

  return { ok: true, data: assayConsumables }
}

function* createAssayConsumable(request) {
  const { auth, payload: { assayId, consumableId, quantity } } = request

  const dataConstraints = yield getConstraints(auth.credentials)

  try {
    yield query('Insert assay consumable')
      .insert({ assayId, consumableId, quantity })
      .into('ConsumableAssay')
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return Boom.conflict('There is already an record for this assay and consumable')
    }
    throw err
  }

  const assayConsumable = yield getAssayConsumable(dataConstraints.partner.id,
    assayId, consumableId)

  return { ok: true, data: assayConsumable }
}

function* updateAssayConsumableQuantity(request) {
  const { auth, params: { assayId, consumableId }, payload: { quantity } } = request

  const dataConstraints = yield getConstraints(auth.credentials)

  yield query('Update assay consumable')
    .from('ConsumableAssay as ca')
    .where('ca.assayId', assayId)
    .andWhere('ca.consumableId', consumableId)
    .update({ quantity })

  const assayConsumable = yield getAssayConsumable(dataConstraints.partner.id,
    assayId, consumableId)

  if (_.isEmpty(assayConsumable)) {
    return Boom.notFound('Assay consumable not found')
  }

  return { ok: true, data: assayConsumable }
}

function* deleteAssayConsumable(request) {
  const { assayId, consumableId } = request.params

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
