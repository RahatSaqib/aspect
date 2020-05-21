const {  formTypeToId, diseaseToId } = require('../../src/shared/dictionary')

async function getBaseForms() {
  // Issues
  const formDefinition = {

    TBCaseForm:{
      fileName:'TBCaseForm.json',
      formDefinition:{order:0,title:'TB medical data', i18nKeyTitle:"TBmedicaldata18nkey", diseaseId:await diseaseToId('tb'), externalId:'TBCaseForm', formTypeId:await formTypeToId('TBCaseForm')},
    },
    HIVCaseForm:{
      fileName:'HIVCaseForm.json',
      formDefinition:{order:0, title:'HIV medical data',  i18nKeyTitle:"TBmedicaldata18nkey", diseaseId:await diseaseToId('hiv'), formTypeId:await formTypeToId('HIVCaseForm'), externalId:'HIVCaseForm'},
    },
  }
  return formDefinition
}

module.exports = {
  getBaseForms,
}
