const Joi = require('joi')
const { asyncHandler } = require('../routes')
const { listTags, listTagsByType, updateTag } = require('./service')

module.exports = [
  {
    method: 'GET',
    path: '/tag/{tagType}',
    handler: asyncHandler(listTags),
    config: {
      description: 'Possible Tag List',
      notes: "List of Tag ID's and title",
      validate: {
        params: {
          tagType: Joi.string()
            .valid('result', 'site', 'device', 'person')
            .description('Tag Type')
            .required(),
        },
      },
    },
  },
  {
    method: 'GET',
    path: '/tag/{tagType}/{id}',
    handler: asyncHandler(listTagsByType),
    config: {
      description: 'Tags for Object',
      notes: "List of Tags ID's and title",
      validate: {
        params: {
          id: Joi.number()
            .integer()
            .description('Id')
            .required(),
          tagType: Joi.string()
            .valid('result', 'site', 'device', 'person')
            .description('Tag Type')
            .required(),
        },
      },
    },
  },
  {
    method: 'PUT',
    path: '/tag/{tagType}/{id}',
    handler: asyncHandler(updateTag),
    config: {
      description: 'Update Tags for Result/Site/Device/Person',
      notes: "List of Tags ID's and title",
      validate: {
        params: {
          id: Joi.number()
            .integer()
            .description('Id')
            .required(),
          tagType: Joi.string()
            .valid('result', 'site', 'device', 'person')
            .description('Tag Type')
            .required(),
        },
        payload: {
          tags: Joi.string()
            .max(500)
            .allow('')
            .required(),
        },
      },
    },
  },
]
