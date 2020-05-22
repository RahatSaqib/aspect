const _ = require('lodash')
const { getConstraints } = require('../auth/constraints')
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
    .innerJoin('FormDefinitionSchema as fschema', 'fd.formDefinitionSchemaId','fschema.id')
    .where('fd.partnerId',dataConstraints.partner.id)
    .modify(filterParams, query, {
      assayId: 'fd.assayId',
      diseaseId: 'fd.diseaseId',
      externalsId: 'fd.externalId',
      formType: 'ft.externalId',
    })
    .select('fd.externalId','fd.assayId','fd.diseaseId','ft.externalId as FormTypeId')

    const forms={}
    // eslint-disable-next-line no-return-assign
    _.each(await formQuery,form=>{
      forms[form.externalId]={
        ...formDictionary[form.externalId],
        assayId:form.assayId,
        diseaseId:form.diseaseId,
        formTypeId: form.formTypeId,
      }}
      )
    return forms

}
module.exports = {
  getForms,
}
