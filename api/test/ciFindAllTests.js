const fs = require('fs')
const path = require('path')
const _ = require('lodash')

const files = []
const strings = []

function findAllTests(directory) {
  fs.readdirSync(directory).forEach(file => {
    const absolute = path.join(directory, file)
    if (fs.statSync(absolute).isDirectory()) {
      return findAllTests(absolute)
    }
    if (
      absolute.endsWith('.spec.js') &&
      !/(findAllTests|\/data\/|\/helpers\/)/.test(absolute)
    ) {
      return files.push(file.replace('.spec.js', ''))
    }
  })
}

function isMocha(context) {
  return ['afterEach', 'after', 'beforeEach', 'before', 'describe', 'it'].every(
    functionName => {
      return context[functionName] instanceof Function
    }
  )
}

if (!isMocha(global)) {
  findAllTests('./api/test/')
  _.map(_.chunk(files, files.length / 3), chunk =>
    strings.push(`test/{${_.join(chunk, ',')}}/*.spec.js`)
  )
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(strings, null, 2))
}
