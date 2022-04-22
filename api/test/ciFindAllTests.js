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
      // return files.push(absolute.replace('api/', ''))
      return files.push(file.replace('.spec.js', ''))
      // return files.push(file)
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
    const problemTests = ['geneXpertLog', 'pakistanTbService', 'result']
    const filesArr = files
    const chunks = chunk(filesArr, 2)
    chunks.map(chunk =>
      strings.push(
        `test/**/{${chunk
          .filter(test => problemTests.indexOf(test) === -1)
          .join(',')}}.spec.js*`
      )
    )
    strings.push(`test/**/{${problemTests.join(',')}}.spec.js*`)
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
