const Joi = require('joi')
const { asyncHandler, validateSortPageParams } = require('../routes')
const { listAssays } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/assay',
    handler: asyncHandler(listAssays),
    config: {
      description: 'Assay List',
      notes: 'Pageable and sortable list of assays',
      auth: { scope: ['assay:view', 'assay:edit'] },
      validate: {
        query: Object.assign(
          {
            name: Joi.string()
              .allow('')
              .description('Filter for assay name'),
          },
          validateSortPageParams('name', 'assayTypeName')
        ),
      },
    },
  },
]

module.exports = { routes }
