module.exports = require('../utils').seed(async knex => {
  // Generate all possible 3-digit numbers (000-999)
  const deviceNumbers = []
  for (let i = 0; i <= 999; i++) {
    const deviceIdentifier = i.toString().padStart(3, '0')
    deviceNumbers.push({
      deviceIdentifier,
      active: false, // Initially inactive until assigned to a real device
    })
  }

  // Insert all numbers in batches to avoid memory issues
  const batchSize = 100
  const batches = []
  for (let i = 0; i < deviceNumbers.length; i += batchSize) {
    const batch = deviceNumbers.slice(i, i + batchSize)
    batches.push(knex('MobileDevice').insert(batch))
  }
  await Promise.all(batches)
}, __filename)
