const { admin, clinician, labUser, regionalOfficer } = require('../../fixtures/jobFunctionBase')

module.exports = [
  {
    ...admin,
    permissions: [
      {
        module: 'assay',
        activity: 'view',
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
        module: 'notification',
        activity: 'edit',
      },
      {
        module: 'operationalData',
        activity: 'view',
      },
      {
        module: 'report',
        activity: 'view',
      },
      {
        module: 'router',
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
      {
        module: 'device',
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
        module: 'treatmentStatus',
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
      {
        module: 'account',
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
        module: 'issue',
        activity: 'edit',
      },
      {
        module: 'reporter',
        activity: 'edit',
      },
    ],
  },
  {
    ...regionalOfficer,
    permissions: [
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'device',
        activity: 'view',
      },
      {
        module: 'person',
        activity: 'view',
      },
      {
        module: 'result',
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
        module: 'notification',
        activity: 'edit',
      },
      {
        module: 'operationalData',
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
      {
        module: 'treatmentStatus',
        activity: 'edit',
      },
      {
        module: 'site',
        activity: 'view',
      },
      {
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'account',
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
        module: 'report',
        activity: 'view',
      },
    ],
  },
  {
    ...labUser,
    permissions: [
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'person',
        activity: 'view',
      },
      {
        module: 'deviceApiKey',
        activity: 'view',
      },
      {
        module: 'inventory',
        activity: 'view',
      },
      {
        module: 'notification',
        activity: 'view',
      },
      {
        module: 'operationalData',
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
      {
        module: 'taskMenu',
        activity: 'view',
      },
      {
        module: 'device',
        activity: 'view',
      },
      {
        module: 'result',
        activity: 'edit',
      },
      {
        module: 'treatmentStatus',
        activity: 'edit',
      },
      {
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'account',
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
        module: 'report',
        activity: 'view',
      },
    ],
  },
  {
    ...clinician,
    permissions: [
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'person',
        activity: 'view',
      },
      {
        module: 'device',
        activity: 'view',
      },
      {
        module: 'result',
        activity: 'edit',
      },
      {
        module: 'deviceApiKey',
        activity: 'view',
      },
      {
        module: 'inventory',
        activity: 'view',
      },
      {
        module: 'notification',
        activity: 'view',
      },
      {
        module: 'operationalData',
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
      {
        module: 'taskMenu',
        activity: 'view',
      },
      {
        module: 'treatmentStatus',
        activity: 'edit',
      },
      {
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'account',
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
        module: 'report',
        activity: 'view',
      },
    ],
  },
]
