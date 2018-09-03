const fs = require('fs-extra')

function start(directory) {
  if (directory) {
    if (fs.lstatSync(directory).isDirectory()) {
      watchTree(directory)
      console.log(`watching: ${directory} for changes`)
    }
    console.log(`cannot watch non-existing directory ${directory}`)
  }
}

function watchTree(directory) {
  fs.watch(directory, { recursive: true }, onChange)
}

function onChange(...rest) {
  console.log(rest)
}

module.exports = {
  start,
}
