const _ = require('lodash')

async function shouldResolveNewResultAlert(knex, issue) {
  const { resultId } = issue

  if (resultId) {
    const result = await knex('Result as r')
      .join('Issue as i', 'r.id', 'i.resultId')
      .join('IssueType as it', 'i.issueTypeId', 'it.id')
      .leftJoin('ResultCategory as rc1', 'r.resultCategory1', 'rc1.id')
      .leftJoin('ResultCategory as rc12', 'r.resultCategory2', 'rc2.id')
      .where({
        'r.id': resultId,
        'it.externalId': 'ResultUploaded',
      })
      .first('r.formData')

    if (result) {
      const { formData } = result
      if (formData) {
        const formDataObject = JSON.parse(formData)
        if (
          !_.isEmpty(formDataObject) ||
          !_.every(
            _.values(formDataObject),
            formDataValue =>
              _.isEmpty(formDataValue) ||
              _.isNil(formDataValue) ||
              formDataValue === ''
          )
        ) {
          return true
        }
      }
    }
  }
  return false
}

module.exports = {
  shouldResolveNewResultAlert,
}
