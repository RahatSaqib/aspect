module.exports = async (schedulerMethod, action, { messageContext }) => {
  return messageContext.run(async knex => {
    try {
      return schedulerMethod(action, { messageContext })
    } catch (ex) {
      await knex('JobExecutionLog').insert({ taskName: schedulerMethod.name })
    }
  })
}
