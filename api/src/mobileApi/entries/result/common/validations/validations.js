const Joi = require('@hapi/joi')
const { optionalAssayAvatarResponseValidation } = require('./optionalAssayAvatarResponseValidation')
const { optionalClinicalResponseResponseValidation } = require('./optionalClinicalResponseResponseValidation')
const { optionalCommentsResponseValidation } = require('./optionalCommentsResponseValidation')
const { optionalEntryTypeResponseValidation } = require('./optionalEntryTypeResponseValidation')
const { optionalFollowUpsResponseValidation } = require('./optionalFollowUpsResponseValidation')
const { optionalHistoryResponseValidation } = require('./optionalHistoryResponseValidation')
const { optionalPatientDataResponseValidation } = require('./optionalPatientDataResponseValidation')
const { optionalSampleSchemaResponseValidation } = require('./optionalSampleSchemaResponseValidation')
const { optionalSearchKeysResponseValidation } = require('./optionalSearchKeysResponseValidation')
const { optionalTestInformationResponseValidation } = require('./optionalTestInformationResponseValidation')
const { optionalTreatmentResponseValidation } = require('./optionalTreatmentResponseValidation')
const { serverTransferResponseValidation } = require('./serverTransferResponseValidation')
const { serverBaseResponseValidation } = require('./serverBaseResponseValidation')
const { returnSiteValidationSchema } = require('./sitePropertyValidation')
const { optionalResultCustomFieldResponseValidation } = require('./optionalResultCustomFieldResponseValidation')

const downloadEntriesResponseValidation = () => {
  return Joi.object()
    .keys({
      data: Joi.array()
        .required()
        .description('Data for all entries')
        .items(
          Joi.object()
            .keys({
              id: Joi.number().required().description('Unique ID of the result for this instance of Aspect'),
              patientId: Joi.string()
                .required()
                .allow(null, '')
                .description('Unique ID of the patient for this entry if available'),
              resultRequiresTreatment: Joi.bool()
                .required()
                .description('Whether the result requires a type of treatment response'),
              requiresFollowUp: Joi.bool().required().description('Whether the entry requires a follow-up'),
              hasFollowUp: Joi.bool().required().description('Whether the entry has been followed up on'),
              noFollowUpPossible: Joi.bool()
                .required()
                .description('Whether it is possible for a follow-up to be done on the entry'),
              noFollowUpPossibleComment: Joi.string()
                .optional()
                .allow(null, '')
                .description('The text that the user entered when flagging the follow up as not possible'),
              updatedOn: Joi.date().required().description('When the entry was last updated in the Aspect database'),
              collectedOn: Joi.optional()
                .allow(null, '')
                .description('When the entry was last updated in the Aspect database'),
              dbUpdatedOn: Joi.optional()
                .allow(null, '')
                .description('When the entry was last updated in the Aspect database'),
              reportableSite: returnSiteValidationSchema(),
              laboratorySite: returnSiteValidationSchema(),
              errorCode: Joi.string().optional().allow(null, '').description('Result error code'),
              laboratorySiteName: Joi.string().optional().allow(null, '').description('Testing site'),
              testEndDate: Joi.date().optional().allow(null, '').description('Date when test was concluded at the lab'),
              resultNotes: Joi.string().optional().allow(null, '').description('Result notes'),
            })
            .concat(optionalAssayAvatarResponseValidation)
            .concat(optionalClinicalResponseResponseValidation)
            .concat(optionalCommentsResponseValidation)
            .concat(optionalFollowUpsResponseValidation)
            .concat(optionalHistoryResponseValidation)
            .concat(optionalPatientDataResponseValidation)
            .concat(optionalSampleSchemaResponseValidation)
            .concat(optionalSearchKeysResponseValidation)
            .concat(optionalTestInformationResponseValidation)
            .concat(optionalEntryTypeResponseValidation)
            .concat(serverTransferResponseValidation)
            .concat(optionalTreatmentResponseValidation)
            .concat(optionalResultCustomFieldResponseValidation)
        ),
    })
    .concat(serverBaseResponseValidation)
}

module.exports = { downloadEntriesResponseValidation }
