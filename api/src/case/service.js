const { knex } = require('../db')

const tblName = 'Case'

/**
 * Gets the case id related to the external id and partner provided
 * @param  {object} _case The case filter
 * @param  {boolean} createIfNonExistent If true, if the case doesn't exist, it will create a new case before returning the caseId
 * @return {int} The case id
 */
async function getCaseId(_case, createIfNonExistent) {
  if (!_case.externalId) return null

  let { caseId } = (await knex(tblName)
    .where(_case)
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
  await knex(tblName).insert(_case)
  const caseId = await getCaseId(_case, false)
  return caseId
}

async function getFirstCase() {
  return knex(tblName).first()
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
  const result = (await getCase(_case)) == null

  return result
}

async function getCase(_case) {
  return knex(tblName)
    .where(_case)
    .first()
}

module.exports = {
  getCaseId,
  addCase,
  getFirstCase,
  removeCase,
  getCase,
}
