module.exports = async job => {
  console.log('Cam inside mqProcessor.js', job)
  if (job.name === 'testJob') {
    return job.data
  }
  return true
}
