const {
  postProcessMergeResult: defaultPostProcessMergeResult,
} = require('../../../../deviceApi/result')

async function postProcessMergeResult(context, result, previousResult) {
  const response = await defaultPostProcessMergeResult(
    context,
    result,
    previousResult
  )
  const { knex } = context
  const resultFromDatabase = await knex('Result as r')
    .where('r.id', result.id)
    .first()
  return Object.assign({}, response, { result: resultFromDatabase })
}

module.exports = postProcessMergeResult
