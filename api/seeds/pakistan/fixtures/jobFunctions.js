const {
  admin,
  clinician,
  labUser,
  regionalOfficer,
  technician,
  mergeJobFunctions,
} = require('../../fixtures/jobFunctionBase')

module.exports = [
  mergeJobFunctions(admin, {
    permissions: [
      {
        module: 'assay',
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
        module: 'task',
        activity: 'edit',
      },
      {
        module: 'operationalData',
        activity: 'view',
      },
      {
        module: 'taskMenu',
        activity: 'view',
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
        module: 'deviceApiKey',
        activity: 'edit',
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
        module: 'router',
        activity: 'view',
      },
    ],
    reports: [
      'xdr_devices_summary',
      'device_summary_report',
      'pk_xpert_site_detailed_report',
      'pk_missing_cartridges_report',
    ],
  }),
  mergeJobFunctions(regionalOfficer, {
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
        module: 'task',
        activity: 'edit',
      },
      {
        module: 'operationalData',
        activity: 'view',
      },
      {
        module: 'taskMenu',
        activity: 'view',
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
        module: 'deviceApiKey',
        activity: 'edit',
      },
    ],
    reports: [
      'xdr_devices_summary',
      'device_summary_report',
      'pk_xpert_site_detailed_report',
      'pk_missing_cartridges_report',
    ],
  }),
  mergeJobFunctions(labUser, {
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
        module: 'task',
        activity: 'view',
      },
      {
        module: 'operationalData',
        activity: 'view',
      },
      {
        module: 'taskMenu',
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
        module: 'deviceApiKey',
        activity: 'view',
      },
      {
        module: 'report',
        activity: 'view',
      },
    ],
    reports: [
      'xdr_devices_summary',
      'device_summary_report',
      'pk_xpert_site_detailed_report',
      'pk_missing_cartridges_report',
    ],
  }),
  mergeJobFunctions(clinician, {
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
        module: 'task',
        activity: 'view',
      },
      {
        module: 'operationalData',
        activity: 'view',
      },
      {
        module: 'taskMenu',
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
        module: 'deviceApiKey',
        activity: 'view',
      },
      {
        module: 'report',
        activity: 'view',
      },
    ],
    reports: [
      'xdr_devices_summary',
      'device_summary_report',
      'pk_xpert_site_detailed_report',
      'pk_missing_cartridges_report',
    ],
  }),
  technician,
]
