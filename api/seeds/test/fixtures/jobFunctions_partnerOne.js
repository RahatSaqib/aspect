const {
  superAdmin,
  regionalAdmin,
  regionalOfficer,
  labUser,
  clinician,
  technician,
  mergeJobFunctions,
  aspectBeta,
  inventoryManager,
} = require('../../fixtures/jobFunctionBase')

const adminEnhanced = mergeJobFunctions(superAdmin, {
  permissions: [
    ...superAdmin.permissions,
    {
      module: 'dashboard',
      activity: 'inventory',
    },
  ],
  reports: [...superAdmin.reports, 'genexpert_issues'],
})

const regionalAdminEnhanced = mergeJobFunctions(regionalAdmin, {
  permissions: [
    ...regionalAdmin.permissions,
    {
      module: 'dashboard',
      activity: 'inventory',
    },
  ],
  reports: [...regionalAdmin.reports, 'genexpert_issues'],
})

module.exports = [
  adminEnhanced,
  regionalAdminEnhanced,
  regionalOfficer,
  labUser,
  clinician,
  {
    name: 'Regional Admin',
    permissions: [
      {
        module: 'treatmentStatus',
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
        module: 'assay',
        activity: 'edit',
      },
      {
        module: 'reporter',
        activity: 'edit',
      },
      {
        module: 'browse',
        activity: 'view',
      },
    ],
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
    ],
  },
  technician,
  aspectBeta,
  inventoryManager,
]
