const _ = require('lodash')
const { addResultWorkflowLogIfChanged } = require('../../../deviceApi/result')

async function postProcessMergeResult(context, result, previousResult) {
  const { knex, payload, now } = context
  await addResultWorkflowLogIfChanged(
    knex,
    payload,
    result,
    previousResult,
    'Device API Update',
    now
  )

  const resultDetails = await knex('Result as r')
    .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
    .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
    .leftJoin('Assay as a', 'r.assayId', 'a.id')
    .leftJoin('Site as s', 'r.siteId', 's.id')
    .where('r.id', result.id)
    .first(
      'rc1.externalId as resultCategory1ExternalId',
      'rc2.externalId as resultCategory2ExternalId',
      'a.externalId as assayExternalId',
      's.externalId as siteExternalId'
    )

  const positiveResultCategories = [
    'Detected',
    'Trace Detected',
    'LessThan1000',
    'MoreThan1000',
  ]
  const existingResultTags = await knex('ResultTag as rt')
    .join('Tag as t', 'rt.tagId', 't.id')
    .where('rt.resultId', result.id)
    .andWhere('t.partnerId', result.partnerId)
    .select('t.id', 't.title')

  if (
    positiveResultCategories.includes(
      resultDetails.resultCategory1ExternalId
    ) ||
    positiveResultCategories.includes(resultDetails.resultCategory2ExternalId)
  ) {
    const positiveResultTagTitle =
      resultDetails.assayExternalId === 'assayAlereQHiv12Detect'
        ? 'EID+'
        : resultDetails.assayExternalId === 'assayAlereQHiv12VLPlasma'
          ? 'HIV-VL>50'
          : null
    if (positiveResultTagTitle) {
      const partnerTags = await knex('Tag')
        .where('partnerId', result.partnerId)
        .select('t.id', 't.title')
      if (!_.some(existingResultTags, { title: positiveResultTagTitle })) {
        const positiveResultTag = _.head(partnerTags, {
          title: positiveResultTagTitle,
        })
        if (positiveResultTag) {
          await knex('ResultTag').insert({
            resultId: result.id,
            tagId: positiveResultTag.id,
          })
        }
      }
      const positiveResultSiteTagTitlePrefix =
        resultDetails.assayExternalId === 'assayAlereQHiv12Detect'
          ? 'EID+'
          : resultDetails.assayExternalId === 'assayAlereQHiv12VLPlasma'
            ? 'VL>50'
            : null
      if (
        !_.some(existingResultTags, {
          title:
            positiveResultSiteTagTitlePrefix + resultDetails.siteExternalId,
        })
      ) {
        const positiveResultSiteTag = _.head(partnerTags, {
          title:
            positiveResultSiteTagTitlePrefix + resultDetails.siteExternalId,
        })
        if (positiveResultSiteTag) {
          await knex('ResultTag').insert({
            resultId: result.id,
            tagId: positiveResultSiteTag.id,
          })
        }
      }
    }
  } else {
    const positiveResultTagIds = _.map(
      _.filter(
        existingResultTags,
        tag =>
          tag.title.toUpperCase().indexOf('EID+') > -1 ||
          tag.title.toUpperCase().indexOf('VL>50') > -1
      ),
      'id'
    )
    if (!_.isEmpty(positiveResultTagIds)) {
      await knex('ResultTag')
        .whereIn('tagId', positiveResultTagIds)
        .andWhere('resultId', result.id)
        .del()
    }
  }
  return {}
}

module.exports = postProcessMergeResult
