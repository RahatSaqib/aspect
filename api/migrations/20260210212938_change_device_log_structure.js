const BATCH_SIZE = 1000

function detectPayloadType(rawMessage) {
  try {
    const payload = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage
    if (payload.result) return 'RESULT'
    if (payload.log) return 'LOG'
    if (payload.includeDeviceConfiguration === true) return 'DAILY_DETAILS'
    if (payload.includeDeviceConfiguration === false && payload.operation) return 'INVENTORY_OPERATION'
    if (payload.includeDeviceConfiguration === false && !payload.result && !payload.log && !payload.operation)
      return 'PING'
  } catch (e) {
    // ignore parse errors
  }
  return 'UNKNOWN'
}

async function migrateDeviceApiKeyId(knex) {
  await knex('DeviceLog as dl')
    .join('Device as d', 'dl.deviceId', 'd.id')
    .whereNotNull('d.deviceApiKeyId')
    .update('dl.deviceApiKeyId', knex.raw('d.deviceApiKeyId'))
}

async function migrateDeviceOperationApiKeyId(knex) {
  await knex('DeviceOperation as op')
    .join('Device as d', 'op.deviceId', 'd.id')
    .whereNotNull('d.deviceApiKeyId')
    .update('op.deviceApiKeyId', knex.raw('d.deviceApiKeyId'))
}

async function migratePayloadType(knex) {
  const { minId, maxId } = await knex('DeviceLog').first({
    minId: knex.raw('MIN(id)'),
    maxId: knex.raw('MAX(id)'),
  })

  if (!minId || !maxId) return

  let processed = minId - 1
  while (processed < maxId) {
    const start = processed + 1
    const end = Math.min(processed + BATCH_SIZE, maxId)
    // eslint-disable-next-line no-console
    console.log(`migrating DeviceLog type batch: ${start}-${end}`)

    // eslint-disable-next-line no-await-in-loop
    const deviceLogs = await knex('DeviceLog').whereBetween('id', [start, end]).select('id', 'rawMessage')

    if (deviceLogs.length > 0) {
      const updates = deviceLogs.map(dl => ({
        id: dl.id,
        type: detectPayloadType(dl.rawMessage),
      }))

      // eslint-disable-next-line no-await-in-loop
      await knex('DeviceLog').insert(updates).onConflict('id').merge()
    }

    processed = end
  }
}

exports.up = async function (knex) {
  await knex.schema.alterTable('DeviceLog', function (table) {
    table.integer('deviceApiKeyId').unsigned().index().after('id')
    table
      .enum('type', ['RESULT', 'LOG', 'DAILY_DETAILS', 'INVENTORY_OPERATION', 'PING', 'UNKNOWN'])
      .index()
      .after('deviceApiKeyId')
  })

  await knex.schema.alterTable('DeviceOperation', function (table) {
    table.integer('deviceApiKeyId').unsigned().nullable().index().references('id').inTable('DeviceApiKey')
  })

  await migrateDeviceApiKeyId(knex)
  await migrateDeviceOperationApiKeyId(knex)
  await migratePayloadType(knex)

  await knex.schema.alterTable('DeviceLog', function (table) {
    table.dropForeign('deviceId')
    table.dropColumn('deviceId')
  })

  await knex.schema.alterTable('DeviceOperation', function (table) {
    table.renameColumn('startedOn', 'occurredOn')
    table.dropColumn('endedOn')
    table.dropColumn('hash')
    table.dropColumn('guid')
    table.dropForeign('deviceId')
    table.dropColumn('deviceId')
  })
}

exports.down = async function (knex) {
  await knex.schema.alterTable('DeviceLog', function (table) {
    table.dropColumn('type')
    table.dropColumn('deviceApiKeyId')
    table.integer('deviceId').unsigned().index().references('id').inTable('Device')
  })

  await knex.schema.alterTable('DeviceOperation', function (table) {
    table.dropForeign('deviceApiKeyId')
    table.dropColumn('deviceApiKeyId')
    table.renameColumn('occurredOn', 'startedOn')
    table.dateTime('endedOn')
    table.string('hash', 32).unique()
    table.uuid('guid')
    table.integer('deviceId').unsigned().notNullable().index().references('id').inTable('Device')
  })
}
