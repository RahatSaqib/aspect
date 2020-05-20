const _ = require('lodash')
const { getConstraints, addConstraints } = require('../auth/constraints')
const {
  knex,
  filterParams,
} = require('../db')
const formDictionary = require('./formsFileDictionary')


async function getForms(request) {
  const { auth, query } = request
  const dataConstraints = await getConstraints(auth.credentials)
  const formQuery =  knex('FormType AS ft')
    .innerJoin('FormDefinition as fd', 'fd.formTypeId','ft.id')
    .innerJoin('FormDefinitionSchema as fschema', 'fd.formTypeId','ft.id')
    .modify(addConstraints, dataConstraints)
    .modify(filterParams,filterParams, query, {
      assayId: 'fd.assayId',
      diseaseId: 'fd.diseaseId',
      externalsId: 'fd.externalId',
      formType: 'ft.externalId',
    })
    .select()


    return _.map(await formQuery,form=>({[form.externalId]: formDictionary[form.externalId]}))

}
module.exports = {
  getForms,
}
