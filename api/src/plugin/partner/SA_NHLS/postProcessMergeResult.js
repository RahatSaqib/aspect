const _ = require('lodash')
const alereFtpConnectorPostProcessMergeResult = require('../../deviceType/AlereFtpConnector/postProcessMergeResult')

async function postProcessMergeResult(context, result, previousResult) {
  const alereFtpConnectorPluginResult = await alereFtpConnectorPostProcessMergeResult(
    context,
    result,
    previousResult
  )

  const { knex } = context

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
  const resultIsPositive =
    positiveResultCategories.includes(
      resultDetails.resultCategory1ExternalId
    ) ||
    positiveResultCategories.includes(resultDetails.resultCategory2ExternalId)
  const positiveResultTagTitle =
    resultDetails.assayExternalId === 'assayAlereQHiv12Detect'
      ? 'EID+'
      : resultDetails.assayExternalId === 'assayAlereQHiv12VLPlasma'
        ? 'HIV-VL>50'
        : null
  if (resultIsPositive && positiveResultTagTitle) {
    const existingResultTags = await knex('ResultTag')
      .where('resultId', result.id)
      .select()
    const partnerTags = await knex('Tag')
      .where('partnerId', result.partnerId)
      .select('id', 'title')

    const positiveResultTag = _.find(
      partnerTags,
      partnerTag =>
        partnerTag.title.toLowerCase() === positiveResultTagTitle.toLowerCase()
    )

    const resultAlreadyTaggedPositive = _.some(existingResultTags, {
      tagId: positiveResultTag.id,
    })

    if (!resultAlreadyTaggedPositive) {
      await knex('ResultTag').insert({
        resultId: result.id,
        tagId: positiveResultTag.id,
      })
    }
    const positiveResultSiteTagTitlePrefix =
      resultDetails.assayExternalId === 'assayAlereQHiv12Detect'
        ? 'EID+'
        : resultDetails.assayExternalId === 'assayAlereQHiv12VLPlasma'
          ? 'VL>50'
          : null

    if (resultDetails.siteExternalId && positiveResultSiteTagTitlePrefix) {
      const positiveResultTagForSite = _.find(
        partnerTags,
        partnerTag =>
          partnerTag.title.toLowerCase() ===
          `${positiveResultSiteTagTitlePrefix}${
            resultDetails.siteExternalId
          }`.toLowerCase()
      )

      const resultAlreadyTaggedPositiveForSite = _.some(existingResultTags, {
        tagId: positiveResultTagForSite.id,
      })

      if (!resultAlreadyTaggedPositiveForSite) {
        await knex('ResultTag').insert({
          resultId: result.id,
          tagId: positiveResultTagForSite.id,
        })
      }
    }
  }
  return alereFtpConnectorPluginResult
}

module.exports = postProcessMergeResult
