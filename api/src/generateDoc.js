/*
This routine generates a markdown file with the security schema for all job functions and permissions.
To run the routine, use the following command from package.json:

yarn doc — Generate security schema for all countries
yarn doc <country> — Generate security schema for a specific country

The output is a markdown file in the `src` folder of the project.
*/

/* eslint-disable no-unused-vars */
/* eslint-disable import/no-dynamic-require */
const _ = require('lodash')
const fs = require('fs')
const path = require('path')

const CRLF = `
`

async function run() {
  // allEndpoints()
  const countryParam = process.argv[2] // Get country parameter from command line
  allJobFunctions(countryParam)
}

/**
 * DO NOT REMOVE
 * helper func to get list of all endpoints and their access levels
 */
function allEndpoints() {
  const result = {}
  fs.readdirSync('./src').forEach(dirName => {
    const filePath = path.join(__dirname, `./${dirName}/endpoints.js`)
    if (!fs.existsSync(filePath)) return

    const { routes } = require(`./${dirName}/endpoints`)
    if (!routes) {
      return
    }
    _.each(routes, ({ path, method, config }) => {
      let auth = config?.auth
      if (_.isPlainObject(auth)) {
        auth = auth.scope
      } else if (_.isNil(auth)) {
        auth = ''
      }

      result[dirName] = result[dirName] || []
      result[dirName] = [
        ...result[dirName],
        {
          path,
          method,
          auth,
        },
      ]
    })
  })
  let csv = [`folder,path,method,permission`]
  _.keys(result).forEach(folder => {
    let items = _.map(result[folder], props => {
      return {
        folder,
        ...props,
      }
    })
    items = _.sortBy(items, ['path', 'method'])
    items.forEach(({ method, path, auth }) => {
      let authStr = ''
      if (_.isBoolean(auth)) {
        authStr = `${auth}`
      } else if (auth?.length > 1) {
        authStr = `"${auth.join(', ')}"`
      } else if (auth?.length === 1) {
        authStr = `${auth[0]}`
      }
      csv = [...csv, `${folder},${path},${method},${authStr}`]
    })
  })
  fs.writeFileSync(path.join(__dirname, `./_stats-auth.csv`), csv.join(CRLF))
}

/**
 * DO NOT REMOVE
 * helper funcs `getSeedFolders` and `allJobFunctions`
 * to generate markdown file with detailed information about
 * all job functions for all countries
 */
function getSeedFolders(dirPath) {
  return fs.readdirSync(dirPath).filter(name => {
    if (
      // skip some folders which are not country seeding folders
      [
        'common',
        'daily_new_results',
        'development',
        'fixtures',
        'relatedObjects',
        'scripts',
        'shared',
        'test',
        'zz_shared',
      ].includes(name) ||
      // skip any files - we need only country seeding folders
      fs.lstatSync(path.join(dirPath, name)).isFile()
    ) {
      return false
    }
    return true
  })
}

function allJobFunctions(countryParam) {
  const dirPath = path.join(__dirname, `../seeds`)

  const commonJobFunctions = require(`../seeds/fixtures/jobFunctions`)
  const commonReports = require(`../seeds/fixtures/Report`)
  const permissionsDefinition = require(`../seeds/fixtures/PermissionsDefinition`)
  // const permissions = require(`../seeds/fixtures/Permission`)

  let seedFolders = _.reduce(
    getSeedFolders(dirPath),
    (acc, folderName) => {
      let folders = [folderName]
      /**
       * if folder doesn't contain subfolder 'fixtures' then process
       * nested level (applicable for some countries, like Lesotho)
       */
      if (!fs.existsSync(path.join(dirPath, folderName, 'fixtures'))) {
        const subFolderPath = path.join(dirPath, folderName)
        folders = getSeedFolders(subFolderPath).map(subFolderName => path.join(folderName, subFolderName))
      }
      acc = [...acc, { country: folderName, folders }]
      return acc
    },
    []
  )

  // Filter by country if parameter is provided
  if (countryParam) {
    const countryParamLower = countryParam.toLowerCase()
    seedFolders = seedFolders.filter(({ country, folders }) => {
      // Check if country folder name matches (case-insensitive)
      if (country.toLowerCase() === countryParamLower) {
        return true
      }
      // Check if any subfolder matches (for nested structures like Lesotho)
      return folders.some(folder => {
        const folderParts = folder.split(path.sep)
        return folderParts.some(part => part.toLowerCase() === countryParamLower)
      })
    })

    if (seedFolders.length === 0) {
      console.error(`No country found matching: ${countryParam}`)
      // eslint-disable-next-line no-console
      console.log('Available countries:', getSeedFolders(dirPath).join(', '))
      process.exit(1)
    }
  }

  const getAnchorText = txt => txt.toLowerCase().split(' ').join('-')
  let contents = ['# Aspect Job Functions and Permissions', '## <a name="top" id="top"></a> Contents']

  let data = []
  seedFolders.forEach(({ folders }) => {
    folders.forEach(folderName => {
      const partnerData = require(`../seeds/${folderName}/fixtures/partnerData`)

      const countryName = partnerData.partner.name

      /**
       * get list of all defined Job Functions for this country
       */
      let filePath = path.join(__dirname, `../seeds`, folderName, `fixtures/jobFunctions.js`)
      let jobFunctions
      if (fs.existsSync(filePath)) {
        jobFunctions = require(`../seeds/${folderName}/fixtures/jobFunctions`)
      } else {
        jobFunctions = commonJobFunctions
      }
      jobFunctions = _.sortBy(jobFunctions, ['name'])

      /**
       * get list of all defined reports for this country
       */
      let countryReports = {}
      filePath = path.join(__dirname, `../seeds`, folderName, `fixtures/reports.js`)
      if (fs.existsSync(filePath)) {
        countryReports = require(`../seeds/${folderName}/fixtures/reports`)
      }
      countryReports = { ...commonReports, ...countryReports }
      /**
       * convert object to array
       */
      countryReports = _.keys(countryReports).map(key => {
        const { name, description, externalId, sheets } = countryReports[key]
        return { name, description, externalId, sheets: sheets?.length || 0 }
      })
      countryReports = _.sortBy(countryReports, ['name', 'externalId'])

      const anchorCountry = getAnchorText(countryName)
      const linkCountry = `[${countryName}](#${anchorCountry})`
      contents = [...contents, ` - Country - **${linkCountry}** (${jobFunctions?.length || 0} job functions)`]
      data = [...data, '---', `## Country <a name="${anchorCountry}" id="${anchorCountry}">${countryName}</a>`]

      /**
       *
       */
      jobFunctions.forEach(jf => {
        const { name: jobFunctionName, reports, permissions } = jf
        jf.anchorJobFunction = `${anchorCountry}-jf-${getAnchorText(jobFunctionName)}`
        jf.linkJobFunction = `[${jobFunctionName}](#${jf.anchorJobFunction})`
        jf.anchorReports = `${jf.anchorJobFunction}-reports`
        jf.anchorPermissions = `${jf.anchorJobFunction}-permissions`
        data = [
          ...data,
          `  - Job function **${jf.linkJobFunction}**`,
          `    - [Reports](#${jf.anchorReports}) (${reports?.length || 0})`,
          `    - [Permissions](#${jf.anchorPermissions}) (${permissions?.length || 0})`,
        ]
      })
      /**
       * loop through all Job Functions and prepare output markdown text
       */
      jobFunctions.forEach(jf => {
        const { name: jobFunctionName, reports, permissions } = jf
        const breadCrumbLine = `<sup> [Top](#top) &nbsp; --&gt; &nbsp; Country ${linkCountry} &nbsp; --&gt; &nbsp; Job Function ${jf.linkJobFunction} </sup>`

        data = [
          ...data,
          '',
          '### &nbsp;',
          `## ${countryName} : Job Function <a name="${jf.anchorJobFunction}" id="${jf.anchorJobFunction}">**${jobFunctionName}**</a>`,
          ` - [Reports](#${jf.anchorReports}) (${reports?.length || 0})`,
          ` - [Permissions](#${jf.anchorPermissions}) (${permissions?.length || 0})`,
        ]

        /**
         * reports for this Job Function
         */
        const jfReports = countryReports.filter(({ externalId }) => reports?.includes(externalId))
        data = [
          ...data,
          '',
          `### <a name="${jf.anchorReports}" id="${jf.anchorReports}">**Reports**</a> (${jfReports?.length})`,
          breadCrumbLine,
          '',
        ]
        jfReports.forEach(({ name, description, sheets, externalId }, index) => {
          data = [
            ...data,
            `Report [ ${index + 1} / ${jfReports.length} ] - **${name}**`,
            '```bash',
            `  "${description}"`,
            '',
            `  sheets: ${sheets}`,
            '```',
          ]
        })

        /**
         * Permissions for this Job Function
         */
        data = [
          ...data,
          '',
          `### <a name="${jf.anchorPermissions}" id="${jf.anchorPermissions}">**Permissions**</a> (${permissions?.length})`,
          breadCrumbLine,
          '',
          // draw table with permissions
          '| Module | Activity  | Description |',
          '| ---    |   :---:   | ---         |',
        ]
        _.sortBy(permissions, ['module', 'activity']).forEach(({ module, activity }) => {
          const { description = '' } =
            permissionsDefinition.find(it => it.module === module && it.activity === activity) || {}
          data = [...data, `| ${module} | ${activity} | ${description} |`]
        })
      })
    })
  })
  data = [...contents, ...data]
  const outputFileName = `./security-schema-${countryParam ? countryParam.toLowerCase() : 'all'}.md`
  fs.writeFileSync(path.join(__dirname, outputFileName), data.join(CRLF))
  // eslint-disable-next-line no-console
  console.log(`Markdown file generated: ${outputFileName}`)
}

run()

module.exports = {
  run,
}
