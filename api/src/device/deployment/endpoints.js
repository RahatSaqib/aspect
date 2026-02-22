const Joi = require('@hapi/joi')
const { asyncHandler } = require('../../routes')
const { listDeployments } = require('./listDeployments')
const { checkAffectedResults } = require('./checkAffectedResults')
const { persistDeploymentChanges } = require('./persistDeploymentChanges')

// start is nullable: the first deployment has no start (covers "from the beginning")
const deploymentSchema = Joi.object({
  id: Joi.number().integer().optional(),
  siteId: Joi.number().integer().required(),
  start: Joi.date().iso().allow(null).optional(),
  end: Joi.date().iso().allow(null).optional(),
})

const changeSchema = Joi.alternatives().try(
  deploymentSchema.keys({
    action: Joi.string().valid('add', 'update').required(),
  }),
  Joi.object({
    id: Joi.number().integer().required(),
    action: Joi.string().valid('delete').required(),
  })
)

const routes = [
  {
    method: 'GET',
    path: '/device/{deviceId}/deployments',
    handler: asyncHandler(listDeployments),
    config: {
      description: 'List Deployments',
      notes: 'List deployment history for a device. The first (oldest) deployment has null start.',
      auth: { scope: ['device:view'] },
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required(),
        },
      },
      response: {
        options: { allowUnknown: false },
        schema: Joi.object({
          ok: Joi.bool().required(),
          data: Joi.array().items(
            Joi.object({
              id: Joi.number().required(),
              siteId: Joi.number().allow(null).required(),
              siteName: Joi.string().allow(null).required(),
              start: Joi.date().allow(null).required(),
              end: Joi.date().allow(null).required(),
            })
          ),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/device/{deviceId}/deployments/check-results',
    handler: asyncHandler(checkAffectedResults),
    config: {
      description: 'Check Affected Results',
      notes: 'Preview how many results would be moved with proposed deployment changes',
      auth: { scope: ['device:edit'] },
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required(),
        },
        payload: {
          deployments: Joi.array().items(deploymentSchema).required(),
        },
      },
      response: {
        options: { allowUnknown: false },
        schema: Joi.object({
          ok: Joi.bool().required(),
          data: Joi.object({
            moves: Joi.array().items(
              Joi.object({
                siteId: Joi.number().required(),
                siteName: Joi.string().allow(null).required(),
                resultCount: Joi.number().required(),
              })
            ),
            gaps: Joi.array().items(
              Joi.object({
                start: Joi.string().allow(null).required(),
                end: Joi.string().allow(null).required(),
                resultCount: Joi.number().required(),
              })
            ),
          }),
        }),
      },
    },
  },
  {
    method: 'POST',
    path: '/device/{deviceId}/deployments/persist',
    handler: asyncHandler(persistDeploymentChanges),
    config: {
      description: 'Persist Deployment Changes',
      notes: 'Save deployment changes enforcing a continuous timeline. Update Result.siteId and Device.siteId.',
      auth: { scope: ['device:edit'] },
      validate: {
        params: {
          deviceId: Joi.string().description('Device id').required(),
        },
        payload: {
          changes: Joi.array().items(changeSchema).min(1).required(),
        },
      },
      response: {
        options: { allowUnknown: false },
        schema: Joi.object({
          ok: Joi.bool().required(),
        }),
      },
    },
  },
]

module.exports = { routes }
