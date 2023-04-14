const Joi = require('@hapi/joi')

const downloadEntriesRequestValidation = () => {
  return {
    query: {
      minUpdatedOn: Joi.date().allow(null).iso().description('updatedOn From Date'),
    },
  }
}

module.exports = { downloadEntriesRequestValidation }
