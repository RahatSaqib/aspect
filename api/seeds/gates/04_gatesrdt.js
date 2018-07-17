module.exports = require('../../src/db').seed(seed)

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where('name', 'GatesRDT')
    .first()

  const { id: commCareGatesRdtAssayId } = await knex('Assay')
    .where('externalId', 'CommCareGatesRDT')
    .first()

  // Skip this seed file if we already have a result form for the GatesRDT assay
  const existingResultForm = await knex('ResultForm')
    .where({ partnerId, assayId: commCareGatesRdtAssayId })
    .first('partnerId', 'assayId')
  if (existingResultForm) {
    return
  }

  await knex('ResultForm').insert({
    partnerId,
    assayId: commCareGatesRdtAssayId,
    formSchema: JSON.stringify({
      expertInterpretation: {
        i18nLabel: 'confirmedInterpretationOfResult',
        control: {
          type: 'ButtonGroup',
          allowMultipleSelection: false,
          options: [
            {
              i18nText: 'none',
              value: null,
              order: 10,
            },
            {
              i18nText: 'negative',
              value: 'negative',
              order: 20,
            },
            {
              i18nText: 'positive',
              value: 'positive',
              order: 30,
            },
            {
              i18nText: 'uninterpretable',
              value: 'uninterpretable',
              order: 40,
            },
          ],
        },
      },
    }),
  })
}
