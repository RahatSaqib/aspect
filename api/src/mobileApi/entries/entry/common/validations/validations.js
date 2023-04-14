const Joi = require('@hapi/joi')
const { serverBaseResponseValidation } = require('./serverBaseResponseValidation')
const { serverWorkflowResponseValidation } = require('./serverWorkflowResponseValidation')
const { serverTreatmentResponseValidation } = require('./serverTreatmentResponseValidation')
const { serverSampleResponseValidation } = require('./serverSampleResponseValidation')
const { serverFollowUpsResponseValidation } = require('./serverFollowUpsResponseValidation')
const { serverClinicalResponseResponseValidation } = require('./serverClinicalResponseResponseValidation')
const { serverTestInformationResponseValidation } = require('./serverTestInformationResponseValidation')
const { serverCommentsResponseValidation } = require('./serverCommentsResponseValidation')
const { serverEntryTypeResponseValidation } = require('./serverEntryTypeResponseValidation')
const { serverTransferResponseValidation } = require('./serverTransferResponseValidation')
const { serverAssayResponseValidation } = require('./serverAssayResponseValidation')

const downloadEntriesResponseValidation = () => {
  return Joi.object().keys({
    ...serverBaseResponseValidation(),
    data: Joi.array()
      .required()
      .description('Data for all entries')
      .items(
        Joi.object().keys({
          id: Joi.number().required().description('Unique ID of the result for this instance of Aspect'),
          externalId: Joi.string().required().description('Unique ID of the result for this diagnostic device'),
          endedOn: Joi.date()
            .required()
            .description(
              'When sample processing ended. Note that the zone designator is empty because this is the local date/time as reported by the device. This should be shown as is and not converted to the user time zone.'
            ),
          updatedOn: Joi.date()
            .required()
            .description(
              'When the result was last updated in the Aspect database. This can be converted to the user time zone.'
            ),
          patientData: Joi.object().allow(null).description('Data about the patient'),
          resultData: Joi.object().allow(null).description('Data about the result'),
          ...serverWorkflowResponseValidation(),
          ...serverTreatmentResponseValidation(),
          ...serverSampleResponseValidation(),
          ...serverFollowUpsResponseValidation(),
          ...serverClinicalResponseResponseValidation(),
          ...serverTestInformationResponseValidation(),
          ...serverCommentsResponseValidation(),
          ...serverEntryTypeResponseValidation(),
          ...serverTransferResponseValidation(),
          ...serverAssayResponseValidation(),
        })
      ),
  })
}

module.exports = { downloadEntriesResponseValidation }
