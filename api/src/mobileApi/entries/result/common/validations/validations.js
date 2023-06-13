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
                .optional()
                .allow(null, '')
                .description('Unique ID of the patient for this entry if available'),
              updatedOn: Joi.date().required().description('When the entry was last updated in the Aspect database'),
              collectedOn: Joi.optional()
                .allow(null, '')
                .description('When the entry was last updated in the Aspect database'),
              dbUpdatedOn: Joi.optional()
                .allow(null, '')
                .description('When the entry was last updated in the Aspect database'),
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
        ),
    })
    .concat(serverBaseResponseValidation)
}

module.exports = { downloadEntriesResponseValidation }
