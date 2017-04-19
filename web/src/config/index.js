const { ASPECT_TARGET } = process.env
if (ASPECT_TARGET === 'local') {
  module.exports = require('./local')
} else if (ASPECT_TARGET === 'test') {
  module.exports = require('./test')
} else if (ASPECT_TARGET === 'dist') {
  module.exports = require('./dist')
}
