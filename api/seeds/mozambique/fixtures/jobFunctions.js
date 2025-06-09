const {
  superAdmin,
  regionalAdmin,
  clinician,
  labUser,
  regionalOfficer,
  mergeJobFunctions,
  technician,
  aspectBeta,
  inventoryManager,
} = require('../../fixtures/jobFunctionBase')

module.exports = [
  mergeJobFunctions(superAdmin, {
    permissions: [
      {
        module: 'account',
        activity: 'edit',
      },
      {
        module: 'assay',
        activity: 'view',
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
        module: 'person',
        activity: 'edit',
      },
      {
        module: 'reporter',
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
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'report',
        activity: 'view',
      },
    ],
  }),
  mergeJobFunctions(regionalAdmin, {
    permissions: [
      {
        module: 'account',
        activity: 'edit',
      },
      {
        module: 'assay',
        activity: 'view',
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
        module: 'person',
        activity: 'edit',
      },
      {
        module: 'reporter',
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
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'report',
        activity: 'view',
      },
    ],
  }),
  mergeJobFunctions(clinician, {
    permissions: [
      {
        module: 'account',
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
        module: 'dashboard',
        activity: 'result',
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
        module: 'browse',
        activity: 'view',
      },
      {
        module: 'device',
        activity: 'view',
      },
      {
        module: 'deviceApiKey',
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
        module: 'person',
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
      {
        module: 'taskMenu',
        activity: 'view',
      },
    ],
  }),
  mergeJobFunctions(regionalOfficer, {
    permissions: [
      {
        module: 'account',
        activity: 'edit',
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
        module: 'result',
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
        module: 'assay',
        activity: 'view',
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
        module: 'person',
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
    ],
  }),
  mergeJobFunctions(labUser, {
    permissions: [
      {
        module: 'account',
        activity: 'edit',
      },
      {
        module: 'case',
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
        module: 'dashboard',
        activity: 'summary',
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
        module: 'device',
        activity: 'view',
      },
      {
        module: 'person',
        activity: 'view',
      },
      {
        module: 'report',
        activity: 'view',
      },
      {
        module: 'reporter',
        activity: 'view',
      },
      {
        module: 'site',
        activity: 'view',
      },
    ],
  }),
  technician,
  aspectBeta,
  inventoryManager,
]
