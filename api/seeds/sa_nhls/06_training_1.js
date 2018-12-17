module.exports = require('../utils').seed(seed)

const _ = require('lodash')
const Promise = require('bluebird')

const config = require('../../src/config')

async function seed(knex) {
  const resultForms = await knex('ResultForm')
    .select()
    .map(resultForm =>
      Object.assign({}, resultForm, {
        formSchema: JSON.parse(resultForm.formSchema),
      })
    )

  // Skip if form schemas have already been changed
  if (
    _.every(resultForms, resultForm =>
      _.isNil(resultForm.formSchema.fields.studyID)
    )
  ) {
    return
  }

  await Promise.map(
    resultForms,
    resultForm => {
      if (!_.isNil(resultForm.formSchema.fields.studyID)) {
        delete resultForm.formSchema.fields.studyID
        return knex('ResultForm')
          .where(_.pick(resultForm, ['partnerId', 'assayId']))
          .update({ formSchema: JSON.stringify(resultForm.formSchema) })
      }
      return Promise.resolve()
    },
    { concurrency: config.db.connectionLimit }
  )
}
