const includes = require('lodash/includes')

const getTypeOfPatientCategory = (typeOfPatient, specimenType, typesOfPatient) => {
  let typeOfPatientCategory = 'Other'

  if (includes(typesOfPatient, typeOfPatient)) {
    typeOfPatientCategory = typeOfPatient
  }

  // '(TB4) Nghi lao ngoài phổi' has sub-categories 'Meningitis TB' and 'Other'
  if (typeOfPatient === '(TB4) Nghi lao ngoài phổi')
    typeOfPatientCategory = `${typeOfPatient}_${specimenType === 'Dịch não tủy' ? 'MeningitisTB' : 'Other'}`

  return typeOfPatientCategory
}

const getMappingFieldName = (reportItem, typeOfPatient) => {
  let fieldName

  // NoResult and Invalid will be consider as Error, including them in the same column
  if (includes(['NoResult', 'Invalid'], reportItem.resultCategory1)) reportItem.resultCategory1 = 'Error'

  if (includes(['NotDetected', 'Error'], reportItem.resultCategory1)) {
    // Includes all the categories not splitted in A and B (see template)
    fieldName = `${reportItem.resultCategory1}_${reportItem.resultCategory2 || 'NA'}_${typeOfPatient}`
  } else if (reportItem.resultCategory2 === 'Indeterminate')
    // Includes all the MTB Detected, but RIF indeterminate categories, splitted in Trace and Other (see template)
    fieldName = `${
      reportItem.resultCategory1 === 'Trace Detected' ? reportItem.resultCategory1 : 'Other'
    }_Indeterminate_${typeOfPatient}`
  else if (
    reportItem.resultCategory1 === 'Detected' &&
    includes(['NotDetected', 'Detected'], reportItem.resultCategory2)
  )
    // Considering custom field VNPreviouslyTreated as Chưa điều trị hoặc điều trị <1 tháng (No Treatment) when value is null
    fieldName = `${reportItem.resultCategory1}_${reportItem.resultCategory2 || 'NA'}_${typeOfPatient}_${
      reportItem.previouslyTreated && reportItem.previouslyTreated !== 'null'
        ? reportItem.previouslyTreated
        : 'Chưa điều trị hoặc điều trị <1 tháng'
    }`

  return fieldName
}

module.exports = {
  getTypeOfPatientCategory,
  getMappingFieldName,
}
