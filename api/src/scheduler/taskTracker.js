const taskTracker = async (schedulerMethod, action, { messageContext }) => {
  return messageContext.run(async knex => {
    let jobExecutionId
    try {
      ;[jobExecutionId] = await knex('JobExecutionLog').insert({
        taskName: schedulerMethod.name,
        startDate: new Date(),
      })

      const jobResult = await schedulerMethod(action, { messageContext })
      await knex('JobExecutionLog')
        .update({
          endDate: new Date(),
          success: true,
        })
        .where('id', jobExecutionId)
      return jobResult
    } catch (ex) {
      await knex('JobExecutionLog')
        .update({
          endDate: new Date(),
          errorMessage: JSON.stringify(ex),
        })
        .where('id', jobExecutionId)
    }
  })
}

module.exports = { taskTracker }
