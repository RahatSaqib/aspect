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
    _.every(resultForms, resultForm => !_.isNil(resultForm.formSchema.fields))
  ) {
    return
  }

  const saNhlsPartner = await knex('Partner')
    .where('name', 'South Africa NHLS')
    .first('id')

  await Promise.map(
    resultForms,
    resultForm => {
      if (_.isNil(resultForm.formSchema.fields)) {
        const newFormSchema = {
          fields: resultForm.formSchema,
          sendChangesOn:
            !saNhlsPartner || resultForm.partnerId !== saNhlsPartner
              ? 'change'
              : 'submit',
        }
        return knex('ResultForm')
          .where(_.pick(resultForm, ['partnerId', 'assayId']))
          .update({ formSchema: JSON.stringify(newFormSchema) })
      }
      return Promise.resolve()
    },
    { concurrency: config.db.connectionLimit }
  )
}
