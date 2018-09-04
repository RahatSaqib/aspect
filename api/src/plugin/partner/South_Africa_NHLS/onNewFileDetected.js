// Called when we see a new file in files/watch/nhls/alereQ/ matching %.csv%
async function onNewFileDetected({ filePath }) {
  console.log(filePath)
}

module.exports = onNewFileDetected
