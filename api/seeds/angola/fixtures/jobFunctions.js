const {
  superAdmin,
  regionalOfficer,
  labManager,
  labUser,
  clinician,
  remoteHealthWorker,
  technician,
  aspectBeta,
  regionalAdmin,
  inventoryManager,
} = require('../../fixtures/jobFunctionBase')

const ntpLevel = {
  name: 'NTP Level',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'unreconciled_inventory_report',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'data_extract',
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
      module: 'device',
      activity: 'view',
    },
    {
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'inventory',
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
    'critical_errors_by_module',
    'unreconciled_inventory_report',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
    'device_calibration_report',
    'device_activity',
    'device_utilization',
    'device_activity_percent',
    'module_swaps',
    'all_results',
    'data_extract',
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
      module: 'device',
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
  superAdmin,
  regionalAdmin,
  { ...superAdmin, name: 'Admin - (IT team)' },
  regionalOfficer,
  { ...labManager, name: 'Lab Head' },
  labUser,
  { ...technician, name: 'Lab Technician' },
  clinician,
  remoteHealthWorker,
  technician,
  ntpLevel,
  partners,
  aspectBeta,
  inventoryManager,
]
