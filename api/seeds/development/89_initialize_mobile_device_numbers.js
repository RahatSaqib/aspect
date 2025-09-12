module.exports = require('../utils').seed(async knex => {
  // Generate all possible 3-digit numbers (000-999)

  for (let i = 0; i <= 999; i++) {
    const deviceAppSpot = i.toString().padStart(3, '0')
    // eslint-disable-next-line no-await-in-loop
    await knex('MobileDevice').insert({
      deviceAppSpot,
      active: false, // Initially inactive until assigned to a real device
      createdOn: new Date(),
      updatedOn: new Date(),
      createdBy: 1,
      updatedBy: 1,
    })
  }
}, __filename)
