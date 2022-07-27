const Joi = require('@hapi/joi')
const { asyncHandler } = require('../routes')
const { listResultCategoryGroupsForSelectList } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/result-category-group/select-list',
    handler: asyncHandler(listResultCategoryGroupsForSelectList),
    config: {
      description: 'Result Category Group List',
      notes: "List of the result category groups' external IDs and the concatenated names of their result categories",
      auth: { scope: ['browse', 'result'] },
      validate: {
        query: {
          assayId: Joi.number(),
        },
      },
    },
  },
]

module.exports = { routes }
