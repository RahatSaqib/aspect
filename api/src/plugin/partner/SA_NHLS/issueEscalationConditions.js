const _ = require('lodash')

async function shouldSendResultPositiveSms(knex, issue) {
  const { resultId } = issue

  if (resultId) {
    const result = await knex('Result as r')
      .join('Issue as i', 'r.id', 'i.resultId')
      .join('IssueType as it', 'i.issueTypeId', 'it.id')
      .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
      .leftJoin('ResultCategory as rc2', 'r.resultCategory2', 'rc2.id')
      .where({
        'r.id': resultId,
        'i.level': 1,
        'it.externalId': 'ResultDataEntered',
      })
      .first(
        'r.formData',
        'rc1.externalId as resultCategory1Id',
        'rc2.externalId as resultCategory2Id'
      )

    if (result) {
      const { formData, resultCategory1Id, resultCategory2Id } = result
      if (formData) {
        const formDataObject = JSON.parse(formData)
        if (
          !_.isEmpty(formDataObject) &&
          !_.every(
            _.values(formDataObject),
            formDataValue =>
              _.isEmpty(formDataValue) ||
              _.isNil(formDataValue) ||
              formDataValue === ''
          )
        ) {
          return [resultCategory1Id, resultCategory2Id].includes('Detected')
        }
      }
    }
  }
  return false
}

module.exports = {
  shouldSendResultPositiveSms,
}
