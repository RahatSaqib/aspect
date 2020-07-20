const { resultModuleReplaced } = require('../../../result/actions')
const { shouldTriggerModuleReplaced } = require('../../utils')

// check for error codes when a result is logged
async function onResultLogged({ resultId }, { messageContext }) {
  const context = messageContext.bindActionCreators({
    resultModuleReplaced,
  })
  await context.run(async knex => {
    const [result] = await knex('Result as r').where('r.id', resultId)

    // check if a module was just now replaced and trigger replacement-issue if it was
    await shouldTriggerModuleReplaced(knex, context, result)
  })
}

module.exports = onResultLogged
