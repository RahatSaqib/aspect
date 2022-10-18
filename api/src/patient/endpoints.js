const { onPatientAdded, onPatientUpdated, onResultLogged } = require('./service')

const subscriptions = [
  {
    actions: {
      PATIENT_ADDED: onPatientAdded,
      PATIENT_UPDATED: onPatientUpdated,
      RESULT_LOGGED: onResultLogged,
    },
  },
]

module.exports = { subscriptions }
