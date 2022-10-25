const Joi = require('@hapi/joi')

const { validateDateRangeParams, validateSortPageParams } = require('../../routes')
const { validateAllGeographyFilterParams } = require('../../geography/requestValidation')

const listWorkloadRequestSchema = {
  query: {
    assayId: Joi.number().description('Filter for assay ID').required(),
    deviceName: Joi.string().allow('').description('Filter for device name'),
    deviceMaintenanceStatusId: Joi.array()
      .items(Joi.string())
      .single()
      .allow(null)
      .description('Filter for device maintenance status external id'),
    ...validateAllGeographyFilterParams(),
    ...validateDateRangeParams(true),
    ...validateSortPageParams(
      'name',
      'deviceStatus',
      'lastPingOn',
      'firstResultConductedOn',
      'lastResultConductedOn',
      'totalTests'
    ),
  },
}

const listWorkloadResponseSchema = {
  options: {
    allowUnknown: false,
  },
  schema: Joi.object().keys({
    ok: Joi.bool().required().description('False if there was some sort of error'),
    total: Joi.number().required().description('The total number of devices that match the given filters'),
    length: Joi.number().required().description('The number of devices included in this response'),
    data: Joi.array().required().description('The devices and the workload for each result category'),
    extraColumns: Joi.array().allow(null).optional().description('Extra columns arrays').items(Joi.object().optional()),
  }),
}

module.exports = {
  listWorkloadRequestSchema,
  listWorkloadResponseSchema,
}
