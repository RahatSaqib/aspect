// --------------------------------------------------------------------
// custom fields for 'patients' array
// --------------------------------------------------------------------
// define arrays for Aspect custom fields - values are from 'connect*option' tables in GxAlert db (for Myanmar)
// Notice that exactly same values should be used for seeding validValues and invalidValues fields in
// DataCategory table later on in this file
// --------------
// standard fields
// --------------
const dictHivStatus = 'Positive,Negative,Unknown,Not on Form'.split(',')
// --------------
// custom fields
// --------------
const dictSampleTypes = 'CSF,Other,Saliva,Pus,Not on Form,Blood,Sputum,Effusion'.split(
  ','
)
const dictMdr = 'On Treatment,Previously Treated,Unknown,Not on Form,No Previous Treatment'.split(
  ','
)
const dictSmear = 'Smear Negative,Not Done,Smear Positive,Not on Form'.split(
  ','
)
const dictOtherReason = 'MDR Contact,Not on Form,Smear Positive Month 2 Treatment,EPTB Suspect,Diabetes mellitus,Smear Positive Month 5 Treatment'.split(
  ','
)
const dictReferralCenter = 'BGL TBC,PSI BGL,Not on Form,MMA BGL,DNB TBC,MMA DNB'.split(
  ','
)

const seedDataCategory = async (
  knex,
  { auditFields, myanmarGeographyId, issueCategoryId, messageSeverityId }
) => {
  // ----------------------------------------------------------------------
  // seed DataCategory
  // ----------------------------------------------------------------------
  await knex('DataCategory').insert([
    {
      name: 'HIV+',
      fieldNames: 'hiv',
      geographyId: myanmarGeographyId,
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
      geographyId: myanmarGeographyId,
      externalId: 'mdr',
      i18nKey: 'dataCategoryMdr',
      validValues: JSON.stringify(dictMdr.filter(x => x !== 'Not on Form')),
      invalidValues: JSON.stringify(dictMdr.filter(x => x === 'Not on Form')),
      cutoffPercentage: 98,
    },
    {
      name: 'Smear+',
      fieldNames: 'smear',
      geographyId: myanmarGeographyId,
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
      geographyId: myanmarGeographyId,
      externalId: 'other',
      i18nKey: 'dataCategoryOther',
      // ----------------------
      // missing of valid/invalid Values fields here means that if field is in patientData json and is
      // not undefined, null or empty string - it is considered as valid
      // ----------------------
      cutoffPercentage: 98,
    },
  ])

  // ----------------------------------------------------------------------
  // seed IssueType, Email/Sms/AlertTemplate, MessageType for 'Data Category Low' issue
  // ----------------------------------------------------------------------
  // helper function
  const setTemplatesAndIssueType = async ({
    messageSeverityId,
    issueCategoryId,
  }) => {
    const message = `{{site.name}}: data category '{{categoryName}}' for {{periodName}} is low ({{percentage}}%)`
    const html = `<em>{{site.name}}:</em> data category '{{categoryName}}' for {{periodName}} is low ({{percentage}}%)`

    const emailTemplateId = await knex('EmailTemplate').insert(
      {
        subject: message,
        body: message,
        htmlBody: html,
        ...auditFields,
      },
      'id'
    )

    const alertTemplateId = await knex('AlertTemplate').insert(
      {
        message,
        ...auditFields,
      },
      'id'
    )

    const smsTemplateId = await knex('SmsTemplate').insert(
      {
        message,
        ...auditFields,
      },
      'id'
    )

    const messageTypeId = await knex('MessageType').insert(
      {
        messageSeverityId,
        alertTemplateId,
        smsTemplateId,
        emailTemplateId,
      },
      'id'
    )

    const issueTypeId = await knex('IssueType').insert(
      {
        name: 'Data Category Low',
        externalId: 'DataCategoryLow',
        i18nKey: 'issueDataCategoryLow',
        issueCategoryId,
        defaultMessageTypeId: messageTypeId,
      },
      'id'
    )

    return {
      emailTemplateId,
      alertTemplateId,
      smsTemplateId,
      messageTypeId,
      issueTypeId,
    }
  }

  // ----------------------------------------------------------------------
  // seed all settings for Data Category Low issue
  // ----------------------------------------------------------------------
  const data = {
    issueCategoryId, // : issueCategories.DataHealth.id,
    messageSeverityId, // : messageSeverities.Alert.id,
  }
  await setTemplatesAndIssueType(data)
}

module.exports = {
  seedDataCategory,
  dictHivStatus,
  dictSampleTypes,
  dictMdr,
  dictSmear,
  dictOtherReason,
  dictReferralCenter,
}
