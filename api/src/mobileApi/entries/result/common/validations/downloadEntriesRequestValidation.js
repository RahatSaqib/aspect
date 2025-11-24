const Joi = require('@hapi/joi')

const downloadEntriesRequestValidation = () => {
  return {
    query: {
      minUpdatedOn: Joi.date().allow(null, '').iso().description('updatedOn From Date'),
      modifiedSince: Joi.date().allow(null, '').iso().description('modifiedSince From Date'),
      submittedSince: Joi.date().allow(null, '').iso().description('Results submitted since this date'),
    },
  }
}

module.exports = { downloadEntriesRequestValidation }
