module.exports = require('../utils').seed(seed, __filename)

const _ = require('lodash')
const { getAdditionalDataFromPayload } = require('../../src/plugin/deviceType/gxUtils')
const { assayNameToExternalId } = require('../../src/shared/assayNameToExternalId')
const { deepMerge } = require('../../src/shared/json')
const { getResultDataHash } = require('../../src/result/common/logic')
const customFieldsMalawi = require('../../src/forms/formsDefinition/CustomFields_Malawi.json')
const customFieldsMtb = require('../../src/forms/formsDefinition/CustomFields_Malawi_Mtb.json')
const customFieldsHiv = require('../../src/forms/formsDefinition/CustomFields_Malawi_Hiv.json')
const customFieldsHivQual = require('../../src/forms/formsDefinition/CustomFields_Malawi_HivQual.json')
const customFieldsHivVL = require('../../src/forms/formsDefinition/CustomFields_Malawi_HivVL.json')

async function seed(knex) {
  const customFields = {
    fields: [
      ...customFieldsMalawi.fields,
      ...customFieldsMtb.fields,
      ...customFieldsHiv.fields,
      ...customFieldsHivQual.fields,
      ...customFieldsHivVL.fields,
    ],
    refForms: [],
  }

  const { minId, maxId } = await knex('mig_missingCustomFields').first({
    minId: knex.raw('MIN(resultId)'),
    maxId: knex.raw('MAX(resultId)'),
  })

  const batchSize = 1000
  const startFrom = minId
  const endAt = maxId

  let processed = startFrom - 1
  while (processed < endAt) {
    const start = processed + 1
    const end = Math.min(processed + batchSize, endAt)
    // eslint-disable-next-line no-console
    console.log(`processing batch: ${start}-${end}`)

    // eslint-disable-next-line no-await-in-loop
    const resultsToUpdate = await getResultsToUpdateInRange(knex, start, end)

    if (resultsToUpdate.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      await knex('Result').insert(resultsToUpdate).onConflict('id').merge()
    }

    processed = end
  }
}

const getResultsToUpdateInRange = async (knex, minId, maxId) => {
  const range = [minId, maxId]

  const resultsToUpdate = await knex('Result as r')
    .join('mig_missingCustomFields as mcf', 'mcf.resultId', 'r.id')
    .whereBetween('mcf.resultId', range)
    .select('r.*', 'mcf.customFields')

  const transformedResults = []
  for (const resultToUpdate of resultsToUpdate) {
    const { customFields, ...existingResult } = resultToUpdate

    try {
      const resultData = JSON.parse(existingResult.resultData)
      const patientData = JSON.parse(existingResult.patientData)

      const payloadAssayName = _.get(resultData, 'assay', '')

      const mappedAssayExternalId = assayNameToExternalId[payloadAssayName.toUpperCase()] || 'GxUnknown'
      const potentialAssayIds = [mappedAssayExternalId]
      if (potentialAssayIds.includes('GxMtbRif') && !potentialAssayIds.includes('GxMtbRifUltra')) {
        potentialAssayIds.push('GxMtbRifUltra')
      }
      if (potentialAssayIds.includes('GxMtbRifUltra') && !potentialAssayIds.includes('GxMtbRif')) {
        potentialAssayIds.push('GxMtbRif')
      }

      const additionalData = getAdditionalDataFromPayload({ data: resultData }, potentialAssayIds) || {}

      const customFieldsData = transformCustomFields(JSON.parse(customFields)) || {}

      const baseResult = {
        ...existingResult,
        ...customFieldsData,
        resultData: deepMerge(resultData, { ...additionalData }),
        patientData: deepMerge(patientData, {
          ...customFieldsData.patientData,
        }),
      }

      const transformedResult = {
        ...baseResult,
        patientData: JSON.stringify(baseResult.patientData),
        resultData: JSON.stringify(baseResult.resultData),
        resultDataHash: getResultDataHash(resultData),
      }
      transformedResults.push(transformedResult)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`skip resultId ${existingResult.id} - Error: ${error}`)
    }
  }

  return transformedResults
}


/**
 * Transforms custom fields improted from gxalert into the format expected by the result.
 * @param {Object} customFields - json object with custom field Ids as keys and values as values.
 * @returns {Object} - The transformed custom fields object, with values in the rigth place to be merged with a result.
 */
const transformCustomFields = customFields => {
  const obj = {}
  const fields = Object.keys(customFields)
  for (const field of fields) {
    const customFieldDef = customFields.fields.find(cf => cf.id === Number(field))
    if (customFieldDef) {
      const value =
        customFieldDef.items?.find(item => item.key === customFields[field])?.value ?? customFields[field]

      _.set(obj, customFieldDef.source, value)

    }

    return obj
  }
}
// Query to populate mig_missingCustomFields table for results without payloads:
/*
set @passPhrase := '...';
set @initVector := '...';
drop table if exists mig_missingCustomFields;
create table mig_missingCustomFields as
select t.TestId as resultId,
       coalesce(
           (
               select json_objectagg(cf.CustomFieldId,
                                     if(cfv.Encrypted,
                                        gxAlertDecrypt(value, t.Salt, @passPhrase, @initVector),
                                        cfv.value))
               from bigpicture.customfieldvalue cfv
               join bigpicture.customfield cf on cfv.CustomFieldId = cf.CustomFieldId
               where cfv.TestId = t.TestId
           ),
           '{}'
       ) as customFields
from bigpicture.test AS t
left join bigpicture.gxconnectraw p on t.TestId = p.TestId
where p.GxConnectRawId is null;

alter table mig_missingCustomFields
    add primary key (resultId);
*/