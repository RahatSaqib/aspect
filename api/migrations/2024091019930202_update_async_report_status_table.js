exports.up = async function (knex) {
  await knex('AsyncReportStatus').insert([{ name: 'Expired', externalId: 'expired' }])
}

exports.down = async function (knex) {
  await knex('AsyncReportStatus').where('externalId', 'expired').del()
}
