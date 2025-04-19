const _ = require('lodash')
const Boom = require('@hapi/boom')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { knex, query } = require('../db')

const SELECT_LIST_FIELDS = [
  'ca.consumableId',
  'ca.assayId',
  'ca.quantity',
  'c.name as consumableName',
  'c.externalId as consumableExternalId',
  'u.name as unitName',
  'u.shortName as unitShortName',
  'a.name as assayName',
  'a.i18nKey as assayI18nKey',
  'c.strategy',
]

async function getConsumableAssays(request) {
  const {
    auth,
    params: { consumableId },
  } = request

  const dataConstraints = await getConstraints(auth.credentials)

  const assayConsumables = await query('Get assay consumables')
    .from('ConsumableAssay as ca')
    .join('Consumable as c', 'ca.consumableId', 'c.id')
    .join('Unit as u', 'c.unit', 'u.id')
    .join('Assay as a', 'ca.assayId', 'a.id')
    .leftJoin('PartnerConsumable as pc', function () {
      this.on('ca.consumableId', 'pc.consumableId').andOn('pc.partnerId', knex.raw(dataConstraints.partner.id))
    })
    .modify(addConstraints, dataConstraints, { assay: 'a' })
    .where('ca.consumableId', consumableId)
    .select(SELECT_LIST_FIELDS)
  return { ok: true, data: assayConsumables }
}

function selectAssayConsumables(knex, dataConstraints, assayId, consumableId) {
  const { partner: { id: partnerId } = {} } = dataConstraints
  return (
    knex('ConsumableAssay as ca')
      .join('Consumable as c', 'ca.consumableId', 'c.id')
      .join('Unit as u', 'c.unit', 'u.id')
      .join('Assay as a', 'ca.assayId', 'a.id')
      .leftJoin('PartnerConsumable as pc', function () {
        this.on('ca.consumableId', 'pc.consumableId').andOn('pc.partnerId', knex.raw(partnerId))
      })
      .modify(addConstraints, dataConstraints, { assay: 'a' })
      .where(function () {
        this.where('ca.assayId', assayId)
        if (consumableId) {
          this.andWhere('ca.consumableId', consumableId)
        }
      })
      // TODO: Revisit once permissions system allows the use of partnerId only in addConstraints
      .andWhere(function () {
        this.whereNull('pc.partnerId')
        if (partnerId) {
          this.orWhere('pc.partnerId', partnerId)
        }
      })
      .select(SELECT_LIST_FIELDS)
  )
}

async function getAssayConsumables(request) {
  const {
    auth,
    params: { assayId },
  } = request

  const dataContraints = await getConstraints(auth.credentials)
  const assayConsumables = await selectAssayConsumables(query('Get assay consumable'), dataContraints, assayId)

  return { ok: true, data: assayConsumables }
}

async function createAssayConsumable(request) {
  const {
    auth,
    payload: { assayId, consumableId, quantity },
  } = request

  const dataConstraints = await getConstraints(auth.credentials)

  try {
    await query('Insert assay consumable').insert({ assayId, consumableId, quantity }).into('ConsumableAssay')
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return Boom.conflict('There is already an record for this assay and consumable')
    }
    throw err
  }

  const assayConsumables = await selectAssayConsumables(
    query('Get assay consumable'),
    dataConstraints,
    assayId,
    consumableId
  )

  return { ok: true, data: _.head(assayConsumables) }
}

async function updateAssayConsumableQuantity(request) {
  const {
    auth,
    params: { assayId, consumableId },
    payload: { quantity },
  } = request

  const dataConstraints = await getConstraints(auth.credentials)

  await query('Update assay consumable')
    .from('ConsumableAssay as ca')
    .where('ca.assayId', assayId)
    .andWhere('ca.consumableId', consumableId)
    .update({ quantity })

  const assayConsumables = await selectAssayConsumables(
    query('Get assay consumable'),
    dataConstraints,
    assayId,
    consumableId
  )

  if (_.isEmpty(assayConsumables)) {
    return Boom.notFound('Assay consumable not found')
  }

  return { ok: true, data: _.head(assayConsumables) }
}

async function deleteAssayConsumable(request) {
  const { assayId, consumableId } = request.params

  await query('Delete assay consumable')
    .from('ConsumableAssay')
    .where('assayId', assayId)
    .andWhere('consumableId', consumableId)
    .delete()

  return { ok: true }
}

module.exports = {
  getConsumableAssays,
  selectAssayConsumables,
  getAssayConsumables,
  createAssayConsumable,
  updateAssayConsumableQuantity,
  deleteAssayConsumable,
}
