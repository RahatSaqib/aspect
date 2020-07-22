const { shouldTriggerModuleReplaced } = require('../../utils')

async function onResultLogged({ resultId }, { messageContext }) {
  await messageContext.run(async knex => {
    // check if a module was just now replaced and trigger replacement-issue if it was
    await shouldTriggerModuleReplaced(knex, messageContext, resultId)
  })
}

module.exports = onResultLogged
