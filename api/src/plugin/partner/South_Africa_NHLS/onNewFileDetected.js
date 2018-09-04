// Called when we see a new file in files/watch/nhls/alereQ/ matching %.csv%
async function onNewFileDetected({ filePath }, { messageContext }) {
  console.log(filePath, messageContext)
}

module.exports = onNewFileDetected
