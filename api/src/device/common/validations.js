const Joi = require('@hapi/joi')

const mergeDevicesSchema = {
  payload: {
    sourceDevicesIds: Joi.array().items(Joi.number()).description('Source devices Ids').required(),
    targetDeviceId: Joi.number().description('Target device Id').required(),
  },
}

module.exports = { mergeDevicesSchema }
