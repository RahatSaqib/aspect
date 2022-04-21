const fs = require('fs')
const path = require('path')

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

function chunk(array, parts) {
  const output = []
  for (let i = parts; i > 0; i--) {
    output.push(array.splice(0, Math.ceil(array.length / i)))
  }
  return output
}

function arrayAllTests({ path }) {
  if (!isMocha(global)) {
    findAllTests(path)
    return JSON.stringify(files, null, 2)
  }
}

function constructMochaCommand({ files }) {
  const filesArr = JSON.parse(files) || 0
  // eslint-disable-next-line no-console
  console.log({ files: filesArr?.length })
  const chunks = chunk(filesArr, 3)
  chunks.map(chunk => strings.push(`test/{${chunk.join(',')}}/*.spec.js`))
  return strings
}

module.exports = {
  constructMochaCommand,
  arrayAllTests,
}

require('make-runnable/custom')({
  printOutputFrame: false,
})
