// Simple seeded random number generator
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/**
 * Generates a random 9-digit integer based on deviceId
 * @param {number} deviceId - The device ID to use as seed
 * @returns {number} A nine-digit integer
 */
function generateInstrumentSerial(deviceId) {
  // Generate one nine-digit number (100000000 to 999999999)
  const randomValue = seededRandom(deviceId)
  const nineDigitNumber = Math.floor(100000000 + randomValue * 900000000)

  return nineDigitNumber
}

/**
 * Generates 4 module objects with pseudo-random 8-digit serials and names based on deviceId and instrumentSerial.
 * The letter used for all module names is chosen pseudo-randomly from ['A', 'B', 'C', 'D'].
 * @param {number} deviceId - The device ID to use as part of the seed.
 * @param {number} instrumentSerial - The instrument serial to use as part of the seed.
 * @returns {Array<{serial: number, name: string}>} Array of 4 module objects.
 */
function generateModules(deviceId, instrumentSerial) {
  const modules = []
  const letters = ['A', 'B', 'C', 'D']
  let currentSeed = deviceId + instrumentSerial

  const letterSeed = currentSeed * 12345 + 67890
  const letterRandom = seededRandom(letterSeed)
  const letterIndex = Math.floor(letterRandom * 4)
  const letter = letters[letterIndex]

  for (let i = 0; i < 4; i++) {
    currentSeed = currentSeed * 9301 + 49297
    const randomValue = seededRandom(currentSeed)
    const eightDigitSerial = Math.floor(10000000 + randomValue * 90000000)
    const name = letter + (i + 1)
    modules.push({
      serial: eightDigitSerial,
      name,
    })
  }

  return modules
}

module.exports = {
  generateInstrumentSerial,
  generateModules,
}
