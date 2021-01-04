const admin = {
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
      activity: 'view',
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
      module: 'router',
      activity: 'view',
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
      module: 'report',
      activity: 'view',
    },
  ],
}

const regionalOfficer = {
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
      module: 'report',
      activity: 'view',
    },
  ],
}

const labUser = {
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
}

const clinician = {
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
}

const deviceMaker = {
  name: 'Device Maker',
  reports: [
    'critical_errors_by_device'
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    }
  ],
}

const ntp = {
  name: 'NTP',
  reports: [
    'critical_errors_by_device'
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    }
  ],
}

const technician = {
  name: 'Technician',
  reports: [
    'critical_errors_by_device'
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    }
  ],
}

const donor = {
  name: 'Donor',
  reports: [
    'critical_errors_by_device',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'site',
      activity: 'view',
    },
    {
      module: 'operationalData',
      activity: 'view',
    }
  ],
}

module.exports = {
  admin,
  regionalOfficer,
  labUser,
  clinician,
  deviceMaker,
  ntp,
  technician,
  donor,
  fixture: [admin, regionalOfficer, labUser, clinician, deviceMaker, ntp, technician, donor],
}
