const {
  superAdmin,
  regionalAdmin,
  clinician,
  donor,
  ntp,
  ntpNoResults,
  technician,
  deviceMaker,
  labUser,
  regionalOfficer,
  systemOne,
  aspectBeta,
  inventoryManager,
  mergeJobFunctions,
} = require('../../fixtures/jobFunctionBase')
const reports = require('./reports')

const countryReports = Object.values(reports).map(report => report.externalId)

module.exports = [
  mergeJobFunctions(superAdmin, {
    reports: [...superAdmin.reports, ...countryReports],
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
  mergeJobFunctions(regionalAdmin, {
    reports: [...regionalAdmin.reports, ...countryReports],
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
    reports: [...clinician.reports, ...countryReports],
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
    reports: [...donor.reports, ...countryReports],
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
    reports: [...labUser.reports, ...countryReports],
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
    reports: [...ntp.reports, ...countryReports],
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
    reports: [...ntpNoResults.reports, ...countryReports],
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
    reports: [...regionalOfficer.reports, ...countryReports],
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
    reports: [systemOne.reports, ...countryReports],
  }),
  mergeJobFunctions(technician, {
    reports: [...technician.reports, ...countryReports],
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
    reports: [...deviceMaker.reports, ...countryReports],
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
  aspectBeta,
  inventoryManager,
]
