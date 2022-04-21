const fs = require('fs')
const path = require('path')

const files = []

function findAllTests(directory) {
  fs.readdirSync(directory).forEach(file => {
    const absolute = path.join(directory, file)
    if (fs.statSync(absolute).isDirectory()) {
      return findAllTests(absolute)
    }
    if (
      absolute.endsWith('.js') &&
      !/(findAllTests|\/data\/|\/helpers\/)/.test(absolute)
    ) {
      return files.push(absolute)
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
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(files, null, 2))
}
