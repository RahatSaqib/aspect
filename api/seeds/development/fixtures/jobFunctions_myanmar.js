const {
  superAdmin,
  labUser,
  regionalOfficer,
  mergeJobFunctions,
  aspectBeta,
  inventoryManager,
} = require('../../fixtures/jobFunctionBase')

module.exports = [
  mergeJobFunctions(superAdmin, {
    permissions: [
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
  mergeJobFunctions(labUser, {
    permissions: [
      {
        module: 'dashboard',
        activity: 'actionInventoryLevelUpdate',
      },
      {
        module: 'device',
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
  mergeJobFunctions(regionalOfficer, {
    permissions: [
      {
        module: 'dashboard',
        activity: 'actionInventoryLevelUpdate',
      },
      {
        module: 'device',
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
  aspectBeta,
  inventoryManager,
]
