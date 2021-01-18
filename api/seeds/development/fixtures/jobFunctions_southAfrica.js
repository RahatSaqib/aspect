const _ = require('lodash')
const {
  admin,
  labUser,
  regionalOfficer,
} = require('../../fixtures/jobFunctionBase')

module.exports = [
  _.merge({}, admin, {
    permissions: [
      {
        module: 'device',
        activity: 'edit',
      },
      {
        module: 'result',
        activity: 'edit',
      },
      {
        module: 'site',
        activity: 'edit',
      },
      {
        module: 'browse',
        activity: 'view',
      },
    ],
  }),
  _.merge({}, labUser, {
    permissions: [
      {
        module: 'result',
        activity: 'edit',
      },
      {
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'device',
        activity: 'view',
      },
      {
        module: 'site',
        activity: 'view',
      },
      {
        module: 'task',
        activity: 'view',
      },
    ],
  }),
  _.merge({}, regionalOfficer, {
    permissions: [
      {
        module: 'result',
        activity: 'edit',
      },
      {
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'device',
        activity: 'view',
      },
      {
        module: 'site',
        activity: 'view',
      },
      {
        module: 'task',
        activity: 'view',
      },
    ],
  }),
]
