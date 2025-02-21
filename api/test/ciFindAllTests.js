const fs = require('fs')
const path = require('path')
const _ = require('lodash')

const tests = []
const categoryChunks = [
  [
    'dashboard',
    'inventory',
    'consumable',
    'issue',
    'notification',
    'pushNotification',
    'emailMq',
    'webhookMq',
    'smsMq',
    'alertMq',
  ],
  ['deviceApiRaw', 'reports', 'report', 'excelReports', 'fact', 'result'],
  ['gxConnect', 'gxconnect', 'customFields'],
  ['geneXpert'],
  ['mobileApi', 'geography', 'deviceApi'],
]
const strings = []

function Ignoredchunk(array, parts) {
  const output = []
  for (let i = parts; i > 0; i--) {
    output.push(array.splice(0, Math.ceil(array.length / i)))
  }
  return output
}

function IgnoredcleanupString(pathString) {
  const split = pathString.split('/')
  return `${split.slice(-2)[0]}/${split.slice(-1)[0]}`
}

function findAllTests(directory) {
  fs.readdirSync(directory).forEach(file => {
    const absolute = path.join(directory, file)
    if (fs.statSync(absolute).isDirectory()) {
      return findAllTests(absolute)
    }
    if (absolute.endsWith('.spec.js') && !/(findAllTests|\/data\/|\/helpers\/)/.test(absolute)) {
      tests.push(absolute.replace('api/test/', ''))
    }
  })
}

function isMocha(context) {
  return ['afterEach', 'after', 'beforeEach', 'before', 'describe', 'it'].every(functionName => {
    return context[functionName] instanceof Function
  })
}

function arrayAllTests({ path }) {
  if (!isMocha(global)) {
    findAllTests(path)
    const matches = _.map(categoryChunks, categories =>
      _.remove(tests, test => categories.some(category => new RegExp(`${category}\\b`, '').test(test)))
    )
    const chunks = _.concat(matches, [tests])
    chunks.map(chunk => strings.push(`test/${chunk.length > 1 ? `{${chunk.join(',')}}` : chunk}`))
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(strings))
  }
}

module.exports = {
  arrayAllTests,
}

require('make-runnable/custom')({
  printOutputFrame: false,
})
