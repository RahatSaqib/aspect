const chokidar = require('chokidar')

function start(directory) {
  const watcher = chokidar.watch(directory, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 1000,
    },
  })
  watcher.on('add', path => {
    // Emit message
  })
  console.log(`watching: ${directory} for changes`)
}

module.exports = {
  start,
}
