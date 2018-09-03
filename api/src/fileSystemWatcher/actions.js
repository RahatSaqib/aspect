// ----------- Action Types ---------------------
const types = {
  NEW_FILE_DETECTED: 'NEW_FILE_DETECTED',
}

// ----------- Action Creators -------------------

/**
 * Creates an action to notify that a new file has been detected in the watch
 * directory configured in .env: file.watcher.directory
 *
 * filePath is required. File path is relative to the process running directory
 */
function newFileDetected(filePath) {
  if (!filePath) {
    throw new Error('Must specify filePath')
  }
  return {
    type: types.NEW_FILE_DETECTED,
    filePath,
  }
}

module.exports = {
  types,
  newFileDetected,
}
