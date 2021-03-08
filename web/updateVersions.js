const packageApi = require('../api/package.json')
const packageWeb = require('./package.json')

packageWeb.appVersions = {
  api: packageApi.version,
  web: packageWeb.version,
}

require('fs').writeFileSync('package.json', JSON.stringify(packageWeb, null, 2))
