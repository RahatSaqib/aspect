const admin = {
  name: 'Admin',
  reports: [
    'MTB_Detected_RR_Detected',
    'Critical_Errors_By_Device',
    'RIF_Resistance_Rate',
    'Results_HIV_Not_Suppressed'
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
    'MTB_Detected_RR_Detected',
    'Critical_Errors_By_Device',
    'RIF_Resistance_Rate',
    'Results_HIV_Not_Suppressed'
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
    'MTB_Detected_RR_Detected',
    'Critical_Errors_By_Device',
    'RIF_Resistance_Rate',
    'Results_HIV_Not_Suppressed'
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
    'MTB_Detected_RR_Detected',
    'Critical_Errors_By_Device',
    'RIF_Resistance_Rate',
    'Results_HIV_Not_Suppressed'
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
    'Critical_Errors_By_Device',
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
    'Critical_Errors_By_Device',
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
    'Critical_Errors_By_Device',
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
    'Critical_Errors_By_Device',
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
  fixture: [admin, regionalOfficer, labUser, clinician, deviceMaker, ntp, techinician, donor],
}
