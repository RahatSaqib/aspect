const util = require('util')
const { expect } = require('chai')
const { runTestWithKnex } = require('../utils/generatorFunctionUtils')

const {
  customFieldsCompletionStatsService,
} = require('../../src/fact/customFieldsCompletionStatsService')
const { getCustomFields } = require('../../src/forms/service')

describe('CustomFieldsCompletionStatsService', async () => {
  it.only('Must retrieve custom fields', async () => {
    const whatever = await customFieldsCompletionStatsService()

    console.log(
      '\x1b[1;34m',
      '🚀  ➜ file: customFieldsCompletionStatsService.test.js ➜ line 14 ➜ it.only ➜ whatever',
      whatever[0]
    )
    expect(whatever).to.be.an('Array')
    expect(whatever.length).to.be.equals(16)

    // expect(Object.keys(d).length).to.be.a('object')

    // Get fields from form service
    // const cf = await getCustomFields(1, 486)

    // get field from Ruslan code
    // await runTestWithKnex(async knex => {
    //   const queryForm = await knex(  'FormType AS ft')
    //     .join('FormDefinition as fd', 'fd.formTypeId', 'ft.id')
    //     .join(
    //       'FormDefinitionSchema as fschema',
    //       'fd.formDefinitionSchemaId',
    //       'fschema.id'
    //     )
    //     .innerJoin('Disease as d', 'fd.diseaseId', 'd.id')
    //     .where('fd.partnerId', 1)
    //     .where('ft.externalId', 'gxConnectForm')
    //     //  .where('d.externalId', 'tb') // <-- includes MTB and MTB-Ultra
    //     .distinct(
    //       'fd.externalId',
    //       'fd.assayId',
    //       'fd.diseaseId',
    //       'ft.externalId as formTypeId',
    //       knex.raw(
    //         "REPLACE(fschema.jsonSchemaFile, '.json', '') as jsonSchemaFileName"
    //       )
    //     )
    //   console.log(
    //     '\x1b[1;37m',
    //     '🚀  ➜ file: customFieldsCompletionStatsService.test.js ➜ line 18 ➜ it.only ➜ queryForm',
    //     queryForm
    //   )
    // })
  })
})
/*
get the fields from the form definitions
get the results
for each result
  identify the form definitions that match the result
  identify the result fields matching the form definition fields, the fields can be in:
      * datientData
      * resultData
      * formData: (Unused)
fill teh customFields
*/
