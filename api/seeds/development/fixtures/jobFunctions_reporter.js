const { superAdmin, labAdmin, mergeJobFunctions } = require('../../fixtures/jobFunctionBase')

module.exports = [
  mergeJobFunctions(superAdmin, {
    permissions: [
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
        module: 'notification',
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
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'report',
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
  mergeJobFunctions(labAdmin, {
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
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'browse',
        activity: 'view',
      },
    ],
  }),
]
