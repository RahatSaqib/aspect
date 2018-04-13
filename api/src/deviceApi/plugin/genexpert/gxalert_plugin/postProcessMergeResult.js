const defaultPostProcessMergeResult = require('../../postProcessMergeResult')

async function postProcessMergeResult(context, result, previousResult) {
  const response = await defaultPostProcessMergeResult(
    context,
    result,
    previousResult
  )
  return Object.assign({}, response, { result })
}

module.exports = postProcessMergeResult
