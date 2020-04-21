const { knex } = require('../db')

const tblName = 'Case'

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

module.exports = {
  getCaseId,
  addCase,
  removeCase,
  getCase,
}
