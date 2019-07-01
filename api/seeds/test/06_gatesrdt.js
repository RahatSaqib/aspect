module.exports = require('../utils').seed(seed, 'test_06_gatesrdt')

async function seed(knex) {
  const { id: partnerId } = await knex('Partner')
    .where('name', 'GatesRDT')
    .first()

  const { id: commCareGatesRdtAssayId } = await knex('Assay')
    .where('externalId', 'CommCareGatesRDT')
    .first()

  await knex('ResultForm').insert({
    partnerId,
    assayId: commCareGatesRdtAssayId,
    formSchema: JSON.stringify({
      fields: {
        expertInterpretation: {
          i18nLabel: 'confirmedInterpretationOfResult',
          control: {
            type: 'ButtonGroup',
            allowMultipleSelection: false,
            options: [
              {
                i18nText: 'none',
                value: null,
              },
              {
                i18nText: 'negative',
                value: 'negative',
              },
              {
                i18nText: 'positive',
                value: 'positive',
              },
              {
                i18nText: 'uninterpretable',
                value: 'uninterpretable',
              },
            ],
          },
        },
      },
      sendChangesOn: 'change',
    }),
  })
}
