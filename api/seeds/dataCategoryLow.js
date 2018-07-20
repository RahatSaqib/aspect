const _ = require('lodash')

// --------------------------------------------------------------------
// custom fields for 'patients' array
// --------------------------------------------------------------------
// values are from 'connect*option' tables in GxAlert db (for Myanmar)
// Notice that exactly same values should be used for seeding validValues and invalidValues fields in
// DataCategory table (see seedDataCategory() in this file)
// --------------
// standard fields
// --------------
const dictHivStatus = ['Positive', 'Negative', 'Unknown', 'Not on Form']
// --------------
// custom fields
// --------------
const dictSampleTypes = [
  'CSF',
  'Other',
  'Saliva',
  'Pus',
  'Not on Form',
  'Blood',
  'Sputum',
  'Effusion',
]
const dictMdr = [
  'On Treatment',
  'Previously Treated',
  'Unknown',
  'Not on Form',
  'No Previous Treatment',
]
const dictSmear = [
  'Smear Negative',
  'Not Done',
  'Smear Positive',
  'Not on Form',
]
const dictOtherReason = [
  'MDR Contact',
  'Not on Form',
  'Smear Positive Month 2 Treatment',
  'EPTB Suspect',
  'Diabetes mellitus',
  'Smear Positive Month 5 Treatment',
]
const dictReferralCenter = [
  'BGL TBC',
  'PSI BGL',
  'Not on Form',
  'MMA BGL',
  'DNB TBC',
  'MMA DNB',
]

// helper function
function getRandomValue(arr, pc = 2) {
  // return values ony in 98% of cases
  if (99 - _.random(99) < pc) return undefined
  return _.isArray(arr)
    ? arr[_.random(arr.length - 1)]
    : `Some string - ${_.random(1000000)}`
}

// -------------------------------------------------------
// getPatients
// -------------------------------------------------------
async function addDataCategoryFields(samplePatients) {
  return _.map(samplePatients, p => {
    // set random values for 50% of persons
    p.hiv = getRandomValue(dictHivStatus, 50) // former 'HIV Status'
    // set values for 98% of persons
    p.sampleType = getRandomValue(dictSampleTypes)
    p.mdr = getRandomValue(dictMdr) // former 'Previous TB History'
    p.smear = getRandomValue(dictSmear) // former 'Microscopy Result'
    p.otherReason = getRandomValue(dictOtherReason) // Other Reason for Test
    p.referralCenter = getRandomValue(dictReferralCenter) // Referral Center
    p.otherNotes = getRandomValue() // Other Notes
    // -------------------------------
    // some above fields are used for Data Category Low issue:
    // hiv, mdr, smear for corresponding data categories,
    // all other mandatory fields are groupped for category Other
    // -------------------------------
    return p
  })
}

// -------------------------------------------------------
// correctOutdated
// -------------------------------------------------------
async function correctOutdated(knex, issueCategoryId) {
  const messageBase = `data category '{{issue.data.categoryName}}' for {{issue.data.periodName}} is low ({{issue.data.percentage}}%)`
  const message = `{{site.name}}: ${messageBase}`
  const html = `<em>{{site.name}}:</em> data category '{{issue.data.categoryName}}' for {{issue.data.periodName}} is low ({{issue.data.percentage}}%)`

  const changeItem = async (tableName, whereClause, updateClause) => {
    const { id } = await knex(tableName)
      .where(whereClause)
      .first('id')

    await knex(tableName)
      .where({ id })
      .update(updateClause)

    return id
  }

  const alertTemplateId = await changeItem(
    'AlertTemplate',
    {
      message:
        '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
    },
    { message: messageBase }
  )

  const smsTemplateId = await changeItem(
    'SmsTemplate',
    {
      message:
        '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
    },
    { message }
  )

  const emailTemplateId = await changeItem(
    'EmailTemplate',
    {
      body:
        '{{dataCategoryName}} collection rate {{dataCategoryCollectionRatePercentage}}',
    },
    {
      subject: message,
      body: message,
      htmlBody: html,
    }
  )

  const { id: messageTypeId } = await knex('MessageType')
    .where({
      alertTemplateId,
      smsTemplateId,
      emailTemplateId,
    })
    .first('id')

  const issueTypeId = await changeItem(
    'IssueType',
    {
      externalId: 'DataCategoryLowError',
    },
    {
      name: 'Data Category Low', // was 'Data Category Low Error'
      externalId: 'DataCategoryLow', // was 'DataCategoryLowError'
      i18nKey: 'issueDataCategoryLow', // was 'issueStatusMachineGenericError'
      issueCategoryId,
      defaultMessageTypeId: messageTypeId,
    }
  )

  return {
    alertTemplateId,
    smsTemplateId,
    emailTemplateId,
    messageTypeId,
    issueTypeId,
  }
}
// -------------------------------------------------------
// seedDataCategory
// -------------------------------------------------------
async function seedDataCategory(knex, partnerName) {
  await correctOutdated(knex)

  const { id: partnerId } = await knex('Partner')
    .where({ name: partnerName })
    .first()

  // ----------------------------------------------------------------------
  // seed DataCategory
  // ----------------------------------------------------------------------
  await knex('DataCategory').insert([
    {
      name: 'HIV+',
      fieldNames: 'hiv',
      partnerId,
      externalId: 'hiv',
      i18nKey: 'dataCategoryHiv',
      validValues: JSON.stringify(
        dictHivStatus.filter(x => x !== 'Not on Form')
      ),
      invalidValues: JSON.stringify(
        dictHivStatus.filter(x => x === 'Not on Form')
      ),
      cutoffPercentage: 98,
    },
    {
      name: 'MDR',
      fieldNames: 'mdr',
      partnerId,
      externalId: 'mdr',
      i18nKey: 'dataCategoryMdr',
      validValues: JSON.stringify(dictMdr.filter(x => x !== 'Not on Form')),
      invalidValues: JSON.stringify(dictMdr.filter(x => x === 'Not on Form')),
      cutoffPercentage: 98,
    },
    {
      name: 'Smear+',
      fieldNames: 'smear',
      partnerId,
      externalId: 'smear',
      i18nKey: 'dataCategorySmear',
      validValues: JSON.stringify(
        dictSmear.filter(x => x === 'Smear Negative' || x === 'Smear Positive')
      ),
      invalidValues: JSON.stringify(
        dictSmear.filter(x => x === 'Not on Form' || x === 'Not Done')
      ),
      cutoffPercentage: 98,
    },
    {
      name: 'Other',
      fieldNames: '["name", "gender", "age"]',
      partnerId,
      externalId: 'other',
      i18nKey: 'dataCategoryOther',
      // ----------------------
      // missing of valid/invalidValues here means that if field is in patientData json and is
      // not undefined, null or empty string - it is considered as valid
      // ----------------------
      cutoffPercentage: 98,
    },
  ])
}

module.exports = {
  seedDataCategory,
  addDataCategoryFields,
}
