module.exports = [
  {
    name: 'Admin',
    reports: [
      'mtb_detected_rr_detected',
      'critical_errors_by_device',
      'rif_resistance_rate',
      'results_hiv_not_suppressed',
    ],
    permissions: [
      {
        module: 'assay',
        activity: 'view',
      },
      {
        module: 'demo',
        activity: 'edit',
      },
      {
        module: 'deviceApiKey',
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
        module: 'inventory',
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
        module: 'task',
        activity: 'view',
      },
      {
        module: 'report',
        activity: 'view',
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
        module: 'dashboard',
        activity: 'summary',
      },
      {
        module: 'dashboard',
        activity: 'result',
      },
      {
        module: 'dashboard',
        activity: 'target',
      },
      {
        module: 'dashboard',
        activity: 'action',
      },
      {
        module: 'dashboard',
        activity: 'actionInventoryLevelUpdate',
      },
      {
        module: 'dashboard',
        activity: 'report',
      },
      {
        module: 'dashboard',
        activity: 'siteFilter',
      },
    ],
  },
  {
    name: 'Regional Officer',
    reports: [
      'mtb_detected_rr_detected',
      'critical_errors_by_device',
      'rif_resistance_rate',
      'results_hiv_not_suppressed',
    ],
    permissions: [
      {
        module: 'dashboard',
        activity: 'action',
      },
      {
        module: 'dashboard',
        activity: 'actionInventoryLevelUpdate',
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
        module: 'inventory',
        activity: 'edit',
      },
      {
        module: 'issue',
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
        module: 'dashboard',
        activity: 'report',
      },
      {
        module: 'dashboard',
        activity: 'siteFilter',
      },
      {
        module: 'dashboard',
        activity: 'summary',
      },
      {
        module: 'dashboard',
        activity: 'target',
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
        module: 'site',
        activity: 'view',
      },
      {
        module: 'task',
        activity: 'view',
      },
    ],
  },
  {
    name: 'Lab User',
    reports: [
      'mtb_detected_rr_detected',
      'critical_errors_by_device',
      'rif_resistance_rate',
      'results_hiv_not_suppressed',
    ],
    permissions: [
      {
        module: 'dashboard',
        activity: 'action',
      },
      {
        module: 'dashboard',
        activity: 'actionInventoryLevelUpdate',
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
        module: 'inventory',
        activity: 'edit',
      },
      {
        module: 'issue',
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
        module: 'dashboard',
        activity: 'report',
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
        module: 'report',
        activity: 'view',
      },
    ],
  },
]
