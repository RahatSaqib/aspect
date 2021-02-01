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
      notes:
        'List of result category groups external IDs and their result categories names concatenated',
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
