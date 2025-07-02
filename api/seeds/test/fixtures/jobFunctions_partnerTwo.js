module.exports = [
  {
    name: 'Lab Manager',
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
        module: 'dashboard',
        activity: 'view',
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
  },
]
