const { admin, labUser, regionalOfficer, mergeJobFunctions, technician } = require('../../fixtures/jobFunctionBase')

module.exports = [
  mergeJobFunctions(admin, {
    permissions: [
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'demo',
        activity: 'edit',
      },
      {
        module: 'deviceApiKey',
        activity: 'edit',
      },
      {
        module: 'site',
        activity: 'edit',
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
        module: 'task',
        activity: 'view',
      },
      {
        module: 'report',
        activity: 'view',
      },
      {
        module: 'case',
        activity: 'edit',
      },
      {
        module: 'reporter',
        activity: 'edit',
      },
      {
        module: 'dashboard',
        activity: 'summary',
      },
      {
        module: 'dashboard',
        activity: 'result',
      },
      {
        module: 'dashboard',
        activity: 'target',
      },
      {
        module: 'dashboard',
        activity: 'action',
      },
      {
        module: 'dashboard',
        activity: 'actionInventoryLevelUpdate',
      },
      {
        module: 'dashboard',
        activity: 'report',
      },
      {
        module: 'dashboard',
        activity: 'siteFilter',
      },
    ],
  }),
  mergeJobFunctions(regionalOfficer, {
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
        module: 'case',
        activity: 'edit',
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
        module: 'dashboard',
        activity: 'target',
      },
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'report',
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
  mergeJobFunctions(labUser, {
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
        module: 'case',
        activity: 'edit',
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
        activity: 'summary',
      },
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'report',
        activity: 'view',
      },
    ],
  }),
  technician,
]
