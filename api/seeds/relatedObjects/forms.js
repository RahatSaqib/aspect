const _ = require('lodash')
const { allFormTypeToId} = require('../../src/shared/dictionary')

async function getBaseForms() {
  // Issues
  const formTypes = await allFormTypeToId()
  const formDefinition = {
  }
  _.each(formTypes, type=>{

    formDefinition[type]=''
  })
  return formDefinition
}

module.exports = {
  getBaseForms,
}
