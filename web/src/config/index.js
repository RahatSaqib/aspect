const { ASPECT_ENV } = process.env
if (ASPECT_ENV === 'dev') {
  module.exports = require('./dev')
} else if (ASPECT_ENV === 'test') {
  module.exports = require('./test')
} else if (ASPECT_ENV === 'dist') {
  module.exports = require('./dist')
}
