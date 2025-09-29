module.exports = require('../utils').seed(async knex => {
  // Generate all possible 3-digit numbers (000-999)
  const mobileDevices = Array.from({ length: 1000 }, (_, i) => ({
    deviceAppSpot: i.toString().padStart(3, '0'),
    active: false, // Initially inactive until assigned to a real device
  }))

  await knex('MobileDevice').insert(mobileDevices)
}, __filename)
