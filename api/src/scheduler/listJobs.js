async function listJobs(request) {
  const { dispatcher } = request.server.app
  return Object.keys(dispatcher)
}

module.exports = { listJobs 