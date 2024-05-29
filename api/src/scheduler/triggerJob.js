const Boom = require('@hapi/boom')

async function triggerJob(request) {
  const { dispatcher } = request.server.app
  const { jobName } = request.params
  if (!dispatcher[jobName]) {
    throw Boom.notFound(`Job '${jobName}' not found.`)
  }
  dispatcher[jobName]()
  return { status: `Job '${jobName}' successfully triggered.` }
}

module.exports = { triggerJob }
