const fs = require('fs')
const path = require('path')

const tests = []
const testsToGroup = []
const testsToRunSeparate = []
const problemTests = ['geneXpertLog', 'geneXpert', 'fact', 'plugin']
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
      // return tests.push(absolute.replace('api/', ''))
      // console.log(
      //   `${directory}/${file}`,
      //   problemTests.some(test => directory.includes(test))
      // )
      // if (problemTests.some(testName => directory.includes(testName))) {
      //   testsToRunSeparate.push(file.replace('.spec.js', ''))
      // } else {
      //   testsToGroup.push(file.replace('.spec.js', ''))
      // }
      tests.push(absolute)
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

function cleanupString(pathString) {
  const split = pathString.split('/')
  return `${split.slice(-2)[0]}/${split.slice(-1)[0]}`
  // .findLast(x => true)
}

function arrayAllTests({ path }) {
  if (!isMocha(global)) {
    findAllTests(path)
    // eslint-disable-next-line no-confusing-arrow
    tests.map(test =>
      problemTests.some(testName => test.includes(testName))
        ? testsToRunSeparate.push(cleanupString(test))
        : testsToGroup.push(cleanupString(test))
    )

    // const testsArr = testsToGroup
    const chunks = chunk(testsToGroup, 1)
    chunks.map(chunk => strings.push(`test/**/{${chunk.join(',')}}`))
    strings.push(`test/**/{${testsToRunSeparate.join(',')}}`)
    // testsToRunSeparate.map(chunk =>
    // )
    // chunks.map(chunk =>
    //   strings.push(
    //     `test/**/{${chunk
    //       .filter(test => problemTests.indexOf(test) === -1)
    //       .join(',')}}.spec.js*`
    //   )
    // )
    // problemTests.map(test => strings.push(`test/**/{${test}}.spec.js*`))

    // console.log(testsToRunSeparate)
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
