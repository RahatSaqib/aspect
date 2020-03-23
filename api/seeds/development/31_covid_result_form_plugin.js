module.exports = require('../utils').seed(seed, __filename)

const utils = require('../utils')

async function seed(knex) {
  utils.hasSeededStaticData = true
  await knex('DeviceType')
    .where('externalId', 'AspectResultEntry')
    .whereNull('plugin')
    .update({ plugin: 'aspectresultentry' })

  const { id: assayAspectResultEntryCovid19Id } = await knex('Assay')
    .where('externalId', 'assayAspectResultEntryCovid19')
    .first('id')
  const { id: partnerId } = await knex('Partner')
    .where('name', 'Wakanda')
    .first('id')
  const covidResultForm = await knex('ResultForm')
    .where({
      partnerId,
      assayId: assayAspectResultEntryCovid19Id,
    })
    .first()

  if (covidResultForm && covidResultForm.formSchema) {
    const formSchema = JSON.parse(covidResultForm.formSchema)
    if (formSchema.sendChangesOn !== 'submit') {
      formSchema.sendChangesOn = 'submit'
      await knex('ResultForm')
        .where({
          partnerId,
          assayId: assayAspectResultEntryCovid19Id,
        })
        .update({
          formSchema: JSON.stringify(formSchema),
        })
    }
  }
}
