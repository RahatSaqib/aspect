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
        module: 'dashboard',
        activity: 'action',
      },
      {
        module: 'dashboard',
        activity: 'actionInventoryLevelUpdate',
      },
      {
        module: 'demo',
        activity: 'edit',
      },
      {
        module: 'device',
        activity: 'edit',
      },
      {
        module: 'deviceApiKey',
        activity: 'edit',
      },
      {
        module: 'inventory',
        activity: 'edit',
      },
      {
        module: 'issue',
        activity: 'edit',
      },
      {
        module: 'person',
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
        module: 'treatmentStatus',
        activity: 'edit',
      },
      {
        module: 'dashboard',
        activity: 'summary',
      },
      {
        module: 'dashboard',
        activity: 'target',
      },
      {
        module: 'dashboard',
        activity: 'report',
      },
      {
        module: 'dashboard',
        activity: 'siteFilter',
      },
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'task',
        activity: 'view',
      },
      {
        module: 'taskMenu',
        activity: 'view',
      },
    ],
  }),
  _.merge({}, labUser, {
    permissions: [
      {
        module: 'dashboard',
        activity: 'action',
      },
      {
        module: 'dashboard',
        activity: 'actionInventoryLevelUpdate',
      },
      {
        module: 'device',
        activity: 'edit',
      },
      {
        module: 'inventory',
        activity: 'edit',
      },
      {
        module: 'issue',
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
        module: 'dashboard',
        activity: 'report',
      },
      {
        module: 'dashboard',
        activity: 'siteFilter',
      },
      {
        module: 'dashboard',
        activity: 'summary',
      },
      {
        module: 'task',
        activity: 'view',
      },
      {
        module: 'taskMenu',
        activity: 'view',
      },
    ],
  }),
  _.merge({}, regionalOfficer, {
    permissions: [
      {
        module: 'dashboard',
        activity: 'action',
      },
      {
        module: 'dashboard',
        activity: 'actionInventoryLevelUpdate',
      },
      {
        module: 'device',
        activity: 'edit',
      },
      {
        module: 'inventory',
        activity: 'edit',
      },
      {
        module: 'issue',
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
        module: 'dashboard',
        activity: 'report',
      },
      {
        module: 'dashboard',
        activity: 'site',
      },
      {
        module: 'dashboard',
        activity: 'summary',
      },
      {
        module: 'dashboard',
        activity: 'target',
      },
      {
        module: 'task',
        activity: 'view',
      },
      {
        module: 'taskMenu',
        activity: 'view',
      },
    ],
  }),
]
