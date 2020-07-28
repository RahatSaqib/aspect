const Joi = require('@hapi/joi')
const { asyncHandler } = require('../routes')
const { getServersByPartner } = require('./service')

const routes = [
  {
    method: 'GET',
    path: '/server',
    handler: asyncHandler(getServersByPartner),
    config: {
      description: 'Result of the servers registered on each partner',
      notes: 'gets the name and the url of the partners server',
      auth: false,
      validate: {},
      response: {
        options: {
          allowUnknown: true,
        },
        schema: {
          data: Joi.array()
            .allow(null)
            .items(
              Joi.object()
                .keys({
                  name: Joi.string()
                    .required()
                    .description('The name of the partner'),
                  serverUrl: Joi.string()
                    .allow(null)
                    .description('The server Url for the partner'),
                })
                .description('The server')
            ),
        },
      },
    },
  },
]

module.exports = { routes }
