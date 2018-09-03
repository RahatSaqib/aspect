const chokidar = require('chokidar')
const config = require('../config')
const { newFileDetected } = require('./actions')

function start(queue) {
  const { file: { watcher: { directory } } } = config
  if (directory) {
    const messageContext = queue.createMessageContext(
      'aspect_file_system_watcher'
    )
    const watcher = chokidar.watch(config.file.watcher.directory, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 1000,
      },
    })
    watcher.on('add', path => {
      messageContext.dispatch(newFileDetected(path))
    })
    console.log(`watching: ${directory} for changes`)
  }
}

module.exports = {
  start,
}
