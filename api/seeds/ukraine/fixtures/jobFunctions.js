module.exports = [
  {
    name: 'Admin',
    reports: [
      'mtb_detected_rr_detected',
      'critical_errors_by_device',
      'rif_resistance_rate',
      'results_hiv_not_suppressed'
    ],
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
        module: 'reporter',
        activity: 'edit',
      },
    ],
  },
  {
    name: 'Regional Officer',
    reports: [
      'mtb_detected_rr_detected',
      'critical_errors_by_device',
      'rif_resistance_rate',
      'results_hiv_not_suppressed'
    ],
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
    ],
  },
  {
    name: 'Lab User',
    reports: [
      'mtb_detected_rr_detected',
      'critical_errors_by_device',
      'rif_resistance_rate',
      'results_hiv_not_suppressed'
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
    ],
  },
  {
    name: 'Clinician',
    reports: [
      'mtb_detected_rr_detected',
      'critical_errors_by_device',
      'rif_resistance_rate',
      'results_hiv_not_suppressed'
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
    ],
  },
]
