const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints } = require('../auth/constraints')
const { addPartnerQueryConstraints } = require('../result/service')

const tblName = 'Case as c'

function validateCaseIdentifier(_case) {
  let errors = ''

  if (!_case.externalId) errors += 'You must provide the externalId field /n'

  if (!_case.partnerId) errors += 'You must provide the partnerId field /n'

  if (errors) throw new Error(errors)
}

/**
 * Gets the case id related to the external id and partner provided
 * @param  {object} _case The case filter
 * @param  {boolean} createIfNonExistent If true, if the case doesn't exist, it will create a new case before returning the caseId
 * @return {int} The case id
 */
async function getCaseId(_case, createIfNonExistent) {
  validateCaseIdentifier(_case)

  let { caseId } = (await knex(tblName)
    .where({
      externalId: _case.externalId,
      partnerId: _case.partnerId,
    })
    .first('id as caseId')) || { caseId: null }

  if (!caseId && createIfNonExistent) caseId = await addCase(_case)

  return caseId
}

/**
 * Adds a new case to database
 * @param  {object} _case
 * @return {int} The created case id
 */
async function addCase(_case) {
  const [caseId] = await knex(tblName).insert(_case)
  return caseId
}

/**
 * Removes the cases associated to the provided filter
 * @param  {object} _case The case filter
 * @return {boolean} True if the action was successful
 */
async function removeCase(_case) {
  await knex(tblName)
    .where(_case)
    .del()
}

async function getCase(_case) {
  validateCaseIdentifier()

  return knex(tblName)
    .where({
      externalId: _case.externalId,
      partnerId: _case.partnerId,
    })
    .first()
}

async function getCases(query, auth) {
  const dataConstraints = await getConstraints(auth.credentials)
  
  /*
OK >>> Country: dropdown (by id) (use result > geography)
OK >>> State: dropdown (by id) (use result > geography)
OK >>> LGA: dropdown (by id) (use result > geography)
OK >>> Disease: dropdown (by id) (use result > assay > assayType > disease)
OK >>> Case ID/Patient ID: one textbox for both (use result[resultData])
OK >>> Attending clinic: textbox (use result > sample > site)
OK >>> PartnerId: this is a fixed filter because it's related to the logged user.
*/

  const casesQuery = knex(tblName)
    .innerJoin('Result as r', 'c.id', 'r.caseId')
    .innerJoin('Geography as g', 'r.geographyId', 'g.id')
    .innerJoin('Assay as a', 'r.assayId', 'a.id')
    .innerJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .innerJoin('Disease as d', 'at.diseaseId', 'd.id')
    .innerJoin('Sample as s', 'r.sampleId', 's.id')
    .innerJoin('Site as sos', 's.originSiteId', 'sos.id')
    .modify(addPartnerQueryConstraints, dataConstraints)
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      sampleOriginSite: 'sos.name',
      diseaseId: 'd.id',
    })
    .modify((queryBuilder, params) => {
      if (params.patientOrResearchId) {
        queryBuilder.where(builder =>
          builder
            .whereRaw(
              'LOWER(c.externalId) like LOWER(?) || LOWER(JSON_EXTRACT(r.patientData, "$.id")) like LOWER(JSON_QUOTE(?))',
              [
                `%${params.patientOrResearchId}%`,
                `%${params.patientOrResearchId}%`,
              ]
            )
            .orWhere('r.researchId', 'like', `%${params.patientOrResearchId}%`)
        )
      }
    }, query)
    .select(
      'c.externalId',
      'sos.name',
      knex.raw(`'Active' as Outcome`),
      knex.raw('LOWER(JSON_EXTRACT(r.patientData, "$.id"))')
    )
    .distinct()

  const getCount = casesQuery
    .clone()
    .count('r.id as count')
    .first()
  // get rows
  const getItems = casesQuery
    .clone()
    .modify(sortPageParams, query, 'endedOn')
    .select()

  console.log(getItems.toString())

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

module.exports = {
  getCaseId,
  addCase,
  removeCase,
  getCase,
  getCases,
}
