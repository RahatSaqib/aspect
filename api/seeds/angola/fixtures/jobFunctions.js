const {
  admin,
  regionalOfficer,
  labManager,
  labUser,
  labTechnician,
  clinician,
  remoteHealthWorker,
  technician,
  ntpLevel,
  partners,
} = require('../../fixtures/jobFunctionBase')

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
