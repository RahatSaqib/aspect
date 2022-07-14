const {
  admin,
  regionalOfficer,
  labUser,
  clinician,
  technician,
  mergeJobFunctions,
} = require('../../fixtures/jobFunctionBase')

const adminEnhanced = mergeJobFunctions(admin, {
  reports: [...admin.reports, 'genexpert_issues'],
})
module.exports = [
  adminEnhaced,
  regionalOfficer,
  labUser,
  clinician,
  {
    name: 'Manager',
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
        module: 'inventory',
        activity: 'edit',
      },
      {
        module: 'reporter',
        activity: 'edit',
      },
    ],
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
    ],
  },
  technician,
]
