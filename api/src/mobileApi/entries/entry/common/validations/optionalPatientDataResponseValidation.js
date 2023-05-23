const Joi = require('@hapi/joi')

const optionalPatientDataResponseValidation = Joi.object()
  .optional()
  .keys({
    comments: Joi.array()
      .allow(null)
      .description('Entry history events')
      .items(
        Joi.object().keys({
          key: Joi.string().required().description('Key of the patient data to identify the expected value'),
          value: Joi.string().required().description('Value of the patient data as per the patientDataSchema'),
          title: Joi.string().required().description('Title of the patient data as per the patientDataSchema'),
          order: Joi.number().required().description('Order of the patient array as per the patientDataSchema'),
        })
      ),
  })

module.exports = { optionalPatientDataResponseValidation }
