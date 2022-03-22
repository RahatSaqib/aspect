const {
  admin,
  clinician,
  donor,
  ntp,
  ntpNoResults,
  technician,
  deviceMaker,
  labUser,
  regionalOfficer,
  systemOne,
  mergeJobFunctions,
} = require('../../fixtures/jobFunctionBase')

module.exports = [
  mergeJobFunctions(admin, {
    reports: [...admin.reports, 'zw_device_performance'],
    permissions: [
      {
        module: 'account',
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
  mergeJobFunctions(clinician, {
    reports: [...clinician.reports, 'zw_device_performance'],
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
        activity: 'summary',
      },
      {
        module: 'dashboard',
        activity: 'result',
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
  mergeJobFunctions(donor, {
    reports: [...donor.reports, 'zw_device_performance'],
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
        module: 'inventory',
        activity: 'view',
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
        module: 'site',
        activity: 'view',
      },
    ],
  }),
  mergeJobFunctions(labUser, {
    reports: [...labUser.reports, 'zw_device_performance'],
    permissions: [
      {
        module: 'account',
        activity: 'edit',
      },
      {
        module: 'inventory',
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
  mergeJobFunctions(ntp, {
    reports: [...ntp.reports, 'zw_device_performance'],
    permissions: [
      {
        module: 'account',
        activity: 'edit',
      },
      {
        module: 'device',
        activity: 'edit',
      },
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'inventory',
        activity: 'view',
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
        module: 'result',
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
  mergeJobFunctions(ntpNoResults, {
    reports: [...ntpNoResults.reports, 'zw_device_performance'],
    permissions: [
      {
        module: 'account',
        activity: 'edit',
      },
      {
        module: 'device',
        activity: 'edit',
      },
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'inventory',
        activity: 'view',
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
    reports: [...regionalOfficer.reports, 'zw_device_performance'],
    permissions: [
      {
        module: 'account',
        activity: 'edit',
      },
      {
        module: 'inventory',
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
  mergeJobFunctions(systemOne, {
    reports: [systemOne.reports, 'zw_device_performance'],
  }),
  mergeJobFunctions(technician, {
    reports: [...technician.reports, 'zw_device_performance'],
    permissions: [
      {
        module: 'account',
        activity: 'edit',
      },
      {
        module: 'device',
        activity: 'view',
      },
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'inventory',
        activity: 'view',
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
  mergeJobFunctions(deviceMaker, {
    reports: [...deviceMaker.reports, 'zw_device_performance'],
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
        module: 'inventory',
        activity: 'view',
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
        module: 'site',
        activity: 'view',
      },
    ],
  }),
]
