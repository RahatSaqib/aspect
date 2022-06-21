const {
  admin,
  regionalOfficer,
  labManager,
  labUser,
  clinician,
  remoteHealthWorker,
  technician,
} = require('../../fixtures/jobFunctionBase')

const labTechnician = {
  name: 'Lab Technician',
  reports: [],
  permissions: [
    {
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'inventory',
      activity: 'edit',
    },
    {
      module: 'assay',
      activity: 'view',
    },
  ],
}

const ntpLevel = {
  name: 'NTP Level',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'device_utilization_per_day',
    'module_activity_report',
    'report_custom_fields_completion',
  ],
  permissions: [
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
      module: 'assay',
      activity: 'view',
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
      activity: 'inventory',
    },
    {
      module: 'dashboard',
      activity: 'target',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
  ],
}

const partners = {
  name: 'Partners',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'device_utilization_per_day',
    'module_activity_report',
    'report_custom_fields_completion',
  ],
  permissions: [
    {
      module: 'result',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'view',
    },
    {
      module: 'assay',
      activity: 'view',
    },
  ],
}

module.exports = [
  admin,
  { ...admin, name: 'Admin - (IT team)' },
  regionalOfficer,
  { ...labManager, name: 'Lab Head' },
  labUser,
  labTechnician,
  clinician,
  remoteHealthWorker,
  technician,
  ntpLevel,
  partners,
]
