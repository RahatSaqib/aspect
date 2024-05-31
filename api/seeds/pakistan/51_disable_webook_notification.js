exports.seed = async knex => {
  await knex('NotificationType')
    .update({ enabled: false })
    .where({ name: 'Cepheid Instrument Log Webhook Notification ' })
}
