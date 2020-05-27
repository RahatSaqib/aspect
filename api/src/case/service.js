const { knex, filterParams, sortPageParams } = require('../db')
const {
  getConstraints,
  addPartnerQueryConstraints,
} = require('../auth/constraints')
const { caseAdded, caseUpdated } = require('./actions')
const {
  getPartnerPluginName,
  getDeviceTypePluginName,
} = require('../plugin/utils')
const { processUsingDataSourceQuery } = require('../stringTemplate/service')

function validateCaseIdentifier(_case) {
  let errors = ''

  if (!_case.externalId) errors += 'You must provide the externalId field /n'

  if (!_case.partnerId) errors += 'You must provide the partnerId field /n'

  if (!_case.diseaseId) errors += 'You must provide the diseaseId field /n'

  if (errors) throw new Error(errors)
}

/**
 * Gets the case id related to the external id and partner provided
 * @param  {object} _case The case filter
 * @param  {boolean} createIfNonExistent If true, if the case doesn't exist, it will create a new case before returning the caseId
 * @param  {int} userId (only necessary if createIfNonExistent is true) The userId that creates the case
 * @return {int} The case id
 */
async function getCaseId(_case, createIfNonExistent, userId) {
  validateCaseIdentifier(_case)

  if (createIfNonExistent && !userId)
    throw new Error(
      "For creating the case if it doesn't exist, you should provide a userId"
    )

  let { caseId } = (await knex('Case')
    .where({
      externalId: _case.externalId,
      partnerId: _case.partnerId,
      diseaseId: _case.diseaseId,
    })
    .first('id as caseId')) || { caseId: null }

  if (!caseId && createIfNonExistent) {
    _case.createdBy = userId
    _case.updatedBy = userId
    caseId = await addCase(_case)
  }

  return caseId
}

/**
 * Adds a new case to database
 * @param  {object} _case
 * @param  {object} options
 * @return {int} The created case id
 */
async function addCase(_case, { messageContext } = {}) {
  const [caseId] = await knex('Case').insert(_case)

  if (messageContext) {
    if (!messageContext.caseAdded) {
      messageContext = messageContext.bindActionCreators({ caseAdded })
    }
    messageContext.caseAdded(caseId)
  }

  return caseId
}

/**
 * Removes the cases associated to the provided filter
 * @param  {object} _case The case filter
 * @return {boolean} True if the action was successful
 */
async function removeCase(_case) {
  await knex('Case').where(_case).del()
}

async function updateCase(whereFields, updateFields, { messageContext } = {}) {
  await knex('Case').where(whereFields).update(updateFields)
  const caseIds = await knex('Case').where(whereFields).select('id').pluck('id')
  if (messageContext && caseIds.length) {
    // queue message for each affected Case row
    if (!messageContext.caseUpdated) {
      messageContext = messageContext.bindActionCreators({ caseUpdated })
    }
    caseIds.forEach(id => messageContext.caseUpdated(id))
  }
  return caseIds
}

async function getCases({ query, auth }) {
  const dataConstraints = await getConstraints(auth.credentials)

  // Querying the last result for each case that has a sample origin site
  const lastResults = knex('Case as cs')
    .innerJoin('Result as r', 'cs.id', 'r.caseId')
    .innerJoin('Sample as s', 'r.sampleId', 's.id')
    .innerJoin('Site as sos', 's.originSiteId', 'sos.id')
    .groupBy('cs.id')
    .select('cs.id as caseId', knex.raw('max(r.id) as lastResultId'))
    .as('lr')

  // Main query only works with each last result per case
  const casesQuery = knex('Case as cs')
    .innerJoin(lastResults, 'cs.id', 'lr.caseId')
    .innerJoin('Result as r', 'lr.lastResultId', 'r.id')
    .innerJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('Disease as d', 'at.diseaseId', 'd.id')
    .innerJoin('Sample as s', 'r.sampleId', 's.id')
    .innerJoin('Site as sos', 's.originSiteId', 'sos.id')
    .innerJoin('User as uc', 'cs.createdBy', 'uc.id')
    .innerJoin('User as uu', 'cs.updatedBy', 'uu.id')
    .modify(addPartnerQueryConstraints, dataConstraints)
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      sampleOriginSite: 'sos.id',
      diseaseId: 'd.id',
    })
    .modify((queryBuilder, params) => {
      if (params.patientOrCaseId) {
        queryBuilder.where(builder =>
          builder
            .whereRaw(
              `LOWER(cs.externalId) like LOWER('%${params.patientOrCaseId}%') || LOWER(JSON_EXTRACT(r.patientData, "$.id")) like LOWER(JSON_QUOTE('%${params.patientOrCaseId}%'))`
            )
            .orWhereRaw(`r.researchId like '%${params.patientOrCaseId}%'`)
        )
      }
    }, query)
    .select(
      'cs.id',
      'cs.externalId',
      'sos.name as attendingClinic',
      'd.name as diseaseName',
      'd.id as diseaseId',
      'd.externalId as diseaseExternalId',
      knex.raw(`'Active' as status`),
      knex.raw(
        'JSON_UNQUOTE(JSON_EXTRACT(r.patientData, "$.id")) as patientId'
      ),
      'cs.createdOn',
      'cs.updatedOn',
      'uc.name as createdBy',
      'uu.name as updatedBy'
    )
    .distinct()

  const getCount = casesQuery.clone().count('r.id as count').first()

  const getItems = casesQuery
    .clone()
    .modify(sortPageParams, query, 'externalId')
    .select()

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  const result = {
    ok: true,
    total,
    length: data.length,
    data,
  }
  return result
}

async function onCaseAdded({ caseId }, { messageContext }) {
  onCaseChanged(caseId, messageContext, true)
}

async function onCaseUpdated({ caseId }, { messageContext }) {
  onCaseChanged(caseId, messageContext, false)
}

async function onCaseChanged(caseId, messageContext, isAdded) {
  // get plugin names
  const { deviceId } = messageContext
  const partnerPluginName = await getPartnerPluginName({ caseId })
  const deviceTypePluginName = await getDeviceTypePluginName(deviceId)
  // exec plugin
  if (partnerPluginName || deviceTypePluginName) {
    const { loadPlugin } = require('../plugin/registration')
    const pluginOnCaseChanged = await loadPlugin(
      [partnerPluginName, deviceTypePluginName],
      isAdded ? 'onCaseAdded' : 'onCaseUpdated'
    )
    await pluginOnCaseChanged({ caseId }, { messageContext })
  }
}

async function getAutoCompleteCases({ auth, query }) {
  const dataConstraints = await getConstraints(auth.credentials)

  const casesQuery = knex('Case as ca')
    .innerJoin('Result as r', 'ca.id', 'r.caseId')
    .innerJoin('Geography as g', 'r.geographyId', 'g.id')
    .leftJoin('Country as c', 'g.countryId', 'c.id')
    .modify(addPartnerQueryConstraints, { ...dataConstraints, caseAlias: 'ca' })
    .modify((queryBuilder, params) => {
      if (params.externalId) {
        queryBuilder.where('ca.externalId', 'like', `%${params.externalId}%`)
      }
    }, query)
    .orderBy('ca.externalId')

  const getCount = casesQuery.clone().count('r.id as count').first()

  const getCases = casesQuery.clone().select(['ca.id', 'ca.externalId'])

  // return result when both queries are finished
  const [{ count: total }, data] = await Promise.all([getCount, getCases])

  const result = {
    ok: true,
    total,
    length: data.length,
    data,
  }

  return result
}

function onResultLogged({ resultId }, { messageContext }) {
  return messageContext.run(async knex => {
    // Linking the result service here to avoid cyclic
    //   references between this service and case service
    const {
      getResultForStringTemplateProcessing,
    } = require('../result/service')
    const {
      RESULT_STRING_TEMPLATE_FIELDS,
    } = require('../result/querySelectors')
    const result = await getResultForStringTemplateProcessing(
      resultId,
      [
        ...RESULT_STRING_TEMPLATE_FIELDS,
        'r.partnerId',
        'pd.canAutoAssignResultByCaseId',
        'r.caseId as existingCaseId',
        'c.externalId as existingCaseExternalId',
        'rca1.reportable as resultCategory1Reportable',
        'rca2.reportable as resultCategory2Reportable',
        'r.updatedBy',
      ],
      knex
    )
    if (result) {
      const {
        canAutoAssignResultByCaseId,
        caseExternalIdTemplate,
        partnerId,
        diseaseId,
        existingCaseId,
        existingCaseExternalId,
        resultCategory1Reportable,
        resultCategory2Reportable,
        updatedBy,
      } = result
      if (
        diseaseId &&
        caseExternalIdTemplate &&
        canAutoAssignResultByCaseId &&
        (resultCategory1Reportable || resultCategory2Reportable)
      ) {
        const { caseExternalId } =
          (await processUsingDataSourceQuery(
            { ...result, caseExternalIdTemplate },
            ['caseExternalIdTemplate']
          )) || {}
        if (caseExternalId) {
          // Get the case that matched the case ID in the payload
          // If the case doesn't exist and the result is not assigned a case yet, creat the case
          let caseId = await getCaseId(
            { partnerId, externalId: caseExternalId, diseaseId },
            !existingCaseId,
            updatedBy
          )
          // If no case was found or created, use the case already assigned to the result
          if (!caseId) {
            caseId = existingCaseId
          }
          // Do nothing if the result is already assigned to a case and the case number has not changed
          if (existingCaseExternalId === caseExternalId) {
            return
          }
          // Lookup if any other cases have the same case number
          const otherCaseId = await getCaseId(
            { partnerId, externalId: caseExternalId, diseaseId },
            false,
            updatedBy
          )
          // If the case number for the result has changed to an unknown case number
          //   update the case number on the existing case
          if (!otherCaseId || otherCaseId === caseId) {
            await updateCase(
              { id: caseId },
              {
                externalId: caseExternalId,
                updatedBy,
                updatedOn: new Date(),
              }
            )
          }
          // If the case ID for the result has changed
          //   update the case ID on the result
          if (existingCaseId !== caseId) {
            await knex('Result')
              .where('id', resultId)
              .update({ caseId: otherCaseId })
            // TODO: If the old case is now empty, should it be purged?
            //       We need to consider if there is a use case for cases
            //       that don't have results, what will happen to the
            //       patient data associated with that case? Do empty cases
            //       even present a problem?
          }
        }
      }
    }
  })
}

module.exports = {
  getCaseId,
  addCase,
  removeCase,
  getCases,
  updateCase,
  // MQ consumers
  onCaseAdded,
  onCaseUpdated,
  getAutoCompleteCases,
  onResultLogged,
}
