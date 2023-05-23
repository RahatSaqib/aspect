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
const { serverBaseResponseValidation } = require('./serverBaseResponseValidation')
const { serverTransferResponseValidation } = require('./serverTransferResponseValidation')

const downloadEntriesResponseValidation = () => {
  return Joi.object().keys({
    serverBaseResponseValidation,
    data: Joi.array()
      .required()
      .description('Data for all entries')
      .items(
        Joi.object().keys({
          id: Joi.number().required().description('Unique ID of the result for this instance of Aspect'),
          patientId: Joi.string()
            .optional()
            .allow(null)
            .description('Unique ID of the patient for this entry if available'),
          assayAvatar: optionalAssayAvatarResponseValidation,
          clinicalResponse: optionalClinicalResponseResponseValidation,
          comments: optionalCommentsResponseValidation,
          followUps: optionalFollowUpsResponseValidation,
          history: optionalHistoryResponseValidation,
          patientData: optionalPatientDataResponseValidation,
          sample: optionalSampleSchemaResponseValidation,
          searchSchema: optionalSearchKeysResponseValidation,
          testInformation: optionalTestInformationResponseValidation,
          testType: optionalEntryTypeResponseValidation,
          transferStatus: serverTransferResponseValidation,
          treatmentStatus: optionalTreatmentResponseValidation,
          updatedOn: Joi.date().required().description('When the entry was last updated in the Aspect database'),
        })
      ),
  })
}

module.exports = { downloadEntriesResponseValidation }
