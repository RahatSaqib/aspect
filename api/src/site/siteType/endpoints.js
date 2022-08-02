const getSiteTypes = require('./getSiteTypes')

const routes = [
  {
    method: 'GET',
    path: '/site/sitetype',
    handler: getSiteTypes,
    config: {
      description: 'Site Type List',
      notes: 'List of site types',
      auth: { scope: ['site'] },
    },
  },
]

module.exports = { routes }
