const admin = {
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
      module: 'device',
      activity: 'edit',
    },
    {
      module: 'case',
      activity: 'edit',
    },
    {
      module: 'demo',
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
      activity: 'device',
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
      activity: 'site',
    },
    {
      module: 'dashboard',
      activity: 'target',
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
      module: 'patient',
      activity: 'edit',
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

const manager = {
  name: 'Manager',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
  ],
  permissions: [
    {
      module: 'dashboard',
      activity: 'device',
    },
    {
      module: 'account',
      activity: 'edit',
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
      module: 'person',
      activity: 'edit',
    },
    {
      module: 'reporter',
      activity: 'edit',
    },
    {
      module: 'site',
      activity: 'edit',
    },
    {
      module: 'dashboard',
      activity: 'inventory',
    },
    {
      module: 'dashboard',
      activity: 'report',
    },
    {
      module: 'dashboard',
      activity: 'site',
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
      module: 'router',
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
    'results_hiv_not_suppressed',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'deviceApiKey',
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
      module: 'result',
      activity: 'edit',
    },
    {
      module: 'treatmentStatus',
      activity: 'edit',
    },
    {
      module: 'dashboard',
      activity: 'result',
    },
    {
      module: 'dashboard',
      activity: 'summary',
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
    {
      module: 'assay',
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
    'results_hiv_not_suppressed',
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
    'results_hiv_not_suppressed',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'case',
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
      module: 'site',
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
      activity: 'inventory',
    },
    {
      module: 'dashboard',
      activity: 'report',
    },
    {
      module: 'dashboard',
      activity: 'site',
    },
    {
      module: 'dashboard',
      activity: 'target',
    },
    {
      module: 'dashboard',
      activity: 'result',
    },
    {
      module: 'dashboard',
      activity: 'device',
    },
    {
      module: 'task',
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
      module: 'router',
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
  reports: ['critical_errors_by_device'],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const ntp = {
  name: 'NTP',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
  ],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const ntpNoResults = {
  name: 'NTP - No Results',
  reports: ['critical_errors_by_device'],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const technician = {
  name: 'Technician',
  reports: ['critical_errors_by_device'],
  permissions: [
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'operationalData',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const donor = {
  name: 'Donor',
  reports: ['critical_errors_by_device'],
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
    },
    {
      module: 'report',
      activity: 'view',
    },
    {
      module: 'task',
      activity: 'view',
    },
  ],
}

const resultViewerNo = {
  name: 'Result Viewer - No',
  reports: ['critical_errors_by_device'],
  permissions: [
    {
      module: 'assay',
      activity: 'view',
    },
    {
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'reporter',
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
      module: 'report',
      activity: 'view',
    },
  ],
}

const resultViewerYes = {
  name: 'Result Viewer - Yes',
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
      module: 'browse',
      activity: 'view',
    },
    {
      module: 'reporter',
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
      module: 'report',
      activity: 'view',
    },
  ],
}

const remoteHealthWorker = {
  name: 'Remote Health Worker',
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
      module: 'dashboard',
      activity: 'summary',
    },
    {
      module: 'dashboard',
      activity: 'inventory',
    },
    {
      module: 'dashboard',
      activity: 'report',
    },
    {
      module: 'dashboard',
      activity: 'site',
    },
    {
      module: 'account',
      activity: 'edit',
    },
    {
      module: 'reporter',
      activity: 'view',
    },
    {
      module: 'report',
      activity: 'view',
    },
  ],
}

const labManager = {
  name: 'Lab Manager',
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
      module: 'device',
      activity: 'edit',
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
      module: 'inventory',
      activity: 'edit',
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
      module: 'task',
      activity: 'view',
    },
  ],
}

const labSupervisor = {
  name: 'Lab Supervisor',
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
      module: 'inventory',
      activity: 'edit',
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
      module: 'task',
      activity: 'view',
    },
  ],
}

const medTech = {
  name: 'Med Tech',
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
      module: 'inventory',
      activity: 'edit',
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
      module: 'task',
      activity: 'view',
    },
  ],
}

const dataViewer = {
  name: 'Data Viewer',
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
      module: 'device',
      activity: 'view',
    },
    {
      module: 'person',
      activity: 'view',
    },
    {
      module: 'result',
      activity: 'view',
    },
    {
      module: 'treatmentStatus',
      activity: 'view',
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
      module: 'operationalData',
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
  ],
}

const systemOne = {
  name: 'SystemOne',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
  ],
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
}

const labAdmin = {
  name: 'Lab Admin',
  reports: [
    'mtb_detected_rr_detected',
    'critical_errors_by_device',
    'rif_resistance_rate',
    'results_hiv_not_suppressed',
  ],
  permissions: [
    {
      module: 'device',
      activity: 'edit'
    },
    {
      module: 'result',
      activity: 'edit'
    },
    {
      module: 'site',
      activity: 'edit'
    },
    {
      module: 'assay',
      activity: 'view'
    },
    {
      module: 'browse',
      activity: 'view'
    }
  ]
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
  manager,
  resultViewerNo,
  resultViewerYes,
  remoteHealthWorker,
  labManager,
  labSupervisor,
  medTech,
  dataViewer,
  ntpNoResults,
  systemOne,
  labAdmin,
}
