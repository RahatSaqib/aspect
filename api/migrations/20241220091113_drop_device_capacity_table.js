exports.up = async function (knex) {
  await knex('AspectSeed')
    .whereIn('fileName', [
      '23_correct_modules_in_DeviceCapacity.js',
      '10_device_capacity.js',
      '12_device_capacity.js',
      '17_device_capacity.js',
      '32_device_capacity.js',
      '19_device_capacity.js',
      '09_device_capacity.js',
      '12_device_capacity.js',
      '03_device_capacity.js',
      '27_device_capacity.js',
      '06_device_capacity.js',
      '10_device_capacity.js',
      '11_device_capacity.js',
      '21_device_capacity.js',
      '32_device_capacity.js',
      '08_device_capacity.js',
      '29_device_capacity.js',
      '03_device_capacity.js',
      '19_device_capacity.js',
      '41_device_capacity.js',
      '16_add_device_capacity_seed.js',
      '42_update_deviceCapacity',
    ])
    .del()

  await knex.schema.table('Device', device => {
    device.dropForeign('deviceCapacityId')
    device.dropColumns('deviceCapacityId')
  })
  await knex.schema.dropTableIfExists('DeviceCapacity')
}

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('DeviceCapacity')
}
