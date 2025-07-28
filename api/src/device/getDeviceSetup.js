const Boom = require('@hapi/boom')
const { getConstraints } = require('../auth/constraints')
const { getDeviceSetup } = require('./common/db')

module.exports = async function ({ params, query, auth }) {
  const { deviceId } = params
  const { includeHistory = false } = query
  
  // Get user constraints
  const dataConstraints = await getConstraints(auth.credentials)
  
  // Get instruments data with constraints applied
  const instrumentRows = await getDeviceSetup(deviceId, dataConstraints, includeHistory)
  
  if (!instrumentRows.length) {
    return Boom.notFound('Device not found')
  }
  
  // Check if device exists but has no instruments
  const hasDevice = instrumentRows.some(row => row.deviceId)
  if (!hasDevice) {
    return Boom.notFound('Device not found')
  }

  // Group modules by instrument
  const instrumentsMap = {}
  let latestLetterByInstrument = {}
  
  instrumentRows.forEach(row => {
    // Skip rows with no instrument (device exists but no instruments)
    if (!row.instrumentSerial) {
      return
    }
    
    if (!instrumentsMap[row.instrumentSerial]) {
      instrumentsMap[row.instrumentSerial] = {
        instrumentSerial: row.instrumentSerial,
        modules: []
      }
      // First module for this instrument (newest due to ordering) determines the letter
      if (!includeHistory && row.moduleName) {
        latestLetterByInstrument[row.instrumentSerial] = row.moduleName.charAt(0)
      }
    }
    
    // Skip rows with no module (instrument exists but no modules)
    if (!row.moduleSerial) {
      return
    }
    
    // For current setup, only include modules with the same letter as the newest
    if (!includeHistory && row.moduleName) {
      const expectedLetter = latestLetterByInstrument[row.instrumentSerial]
      if (expectedLetter && row.moduleName.charAt(0) !== expectedLetter) {
        return // Skip this module
      }
    }
    
    instrumentsMap[row.instrumentSerial].modules.push({
      moduleSerial: row.moduleSerial,
      moduleName: row.moduleName,
      startedOn: row.startedOn,
      lastSeenOn: row.lastSeenOn,
      removedOn: row.removedOn
    })
  })

  // Sort modules by moduleName for each instrument
  Object.values(instrumentsMap).forEach(instrument => {
    instrument.modules.sort((a, b) => {
      if (!a.moduleName && !b.moduleName) return 0
      if (!a.moduleName) return 1
      if (!b.moduleName) return -1
      return a.moduleName.localeCompare(b.moduleName)
    })
  })

  return {
    ok: true,
    data: {
      deviceId: parseInt(deviceId),
      instruments: Object.values(instrumentsMap),
    },
  }
}