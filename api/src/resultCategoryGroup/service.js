const isArray = require('lodash/isArray')
const { knex } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { allAssayToId } = require('../shared/dictionary')

async function listResultCategoryGroupsForSelectList(request) {
  const { auth } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const { assayId } = request.query

  const { GxMtbRif: assayGeneXpertMtbRifId, GxMtbRifUltra: assayGeneXpertMtbRifUltraId } = await allAssayToId()

  let data = await knex('ResultCategoryGroup as rcg')
    .innerJoin('Assay as a', 'rcg.assayId', 'a.id')
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
    })
    .modify(qb => {
      if (isArray(assayId)) qb.whereIn('rcg.assayId', assayId)
      else qb.where('rcg.assayId', assayId)
    })
    .select(['a.i18nKey as assayI18nKey', 'rcg.assayId', 'rcg.externalId', 'rcg.name', 'rcg.i18nKey'])

  data = [
    ...data,
    {
      assayI18nKey: 'assayGeneXpertMtbRif',
      assayId: assayGeneXpertMtbRifId,
      externalId: 'GxMtbRifSomeResult',
      name: 'Some Result',
      i18nKey: 'GxMtbRifSomeResult',
    },
    {
      assayI18nKey: 'assayGeneXpertMtbRifUltra',
      assayId: assayGeneXpertMtbRifUltraId,
      externalId: 'GxMtbRifUltraSomeResult',
      name: 'Some Result',
      i18nKey: 'GxMtbRifUltraSomeResult',
    },
  ]

  return { ok: true, data }
}

module.exports = {
  listResultCategoryGroupsForSelectList,
}
