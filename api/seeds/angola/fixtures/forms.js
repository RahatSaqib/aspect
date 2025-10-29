const baseForms = require('../../fixtures/forms.json')
const clinicalResponseForm = require('../../fixtures/ClinicalResponseForm')

module.exports = {
  ...baseForms,
  ClinicalResponse: clinicalResponseForm,
}
