const fs = require('fs')
const path = require('path')
const _ = require('lodash')

const tests = []
const problemTests = ['geneXpertLog', 'geneXpert', 'fact', 'plugin']
// const problemTests = ['fact']
const strings = []

// function chunk(array, parts) {
//   const output = []
//   for (let i = parts; i > 0; i--) {
//     output.push(array.splice(0, Math.ceil(array.length / i)))
//   }
//   return output
// }

// function cleanupString(pathString) {
//   const split = pathString.split('/')
//   return `${split.slice(-2)[0]}/${split.slice(-1)[0]}`
// }

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
      tests.push(absolute.replace('api/test/', ''))
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

function arrayAllTests({ path }) {
  if (!isMocha(global)) {
    findAllTests(path)
    // const startSum = tests.length
    const matches = _.map(problemTests, string =>
      _.remove(tests, test => new RegExp(`${string}\\b`, '').test(test))
    )
    const chunks = _.concat(matches, [tests])
    // eslint-disable-next-line no-return-assign
    // const checksum = _.reduce(chunks, (acc, curr) => (acc += curr.length), 0)

    // eslint-disable-next-line no-console
    // console.log(
    //   `Cheksum: ${startSum}:${checksum}`,
    //   startSum === checksum ? `✅` : `🤬`
    // )

    // console.log(chunks)

    // const testsArr = [...tests]
    // const chunks = chunk(testsArr, 1)

    // tests.map(test =>
    //   problemTests.some(testName => test.includes(testName))
    //     ? testsToRunSeparate.push(cleanupString(test))
    //     : testsToGroup.push(cleanupString(test))
    // )
    // tests.map(test =>
    //   // eslint-disable-next-line no-confusing-arrow
    //   problemTests.some(testName =>
    //     test.includes(testName)
    //       ? testsToRunSeparate.push({
    //           [testName]: { data: cleanupString(test) },
    //         })
    //       : testsToGroup.push(cleanupString(test))
    //   )
    // )
    // tests.map(
    //   test =>
    //     !problemTests.some(testName => test.includes(testName)) &&
    //     testsToGroup.push(cleanupString(test))
    // )

    // const testsArr = testsToGroup
    // const chunks = chunk(testsToGroup, 1)
    chunks.map(chunk =>
      strings.push(`test/${chunk.length > 1 ? `{${chunk.join(',')}}` : chunk}`)
    )
    // console.log(testsToRunSeparate)
    // problemTests.map(test => console.log(test))
    // strings.push(`test/**/{${testsToRunSeparate.join(',')}}`)
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

// problemTests.some(testName => {
//   if (curr.includes(testName)) {
//     ;(acc[testName] || (acc[testName] = [])).push(cleanupString(curr))
//   }
// })
//   // console.log(curr, testName)

//   // ;(result[value] || (result[value] = [])).push(key)

//   // if (curr.includes(testName)) {
//   //   console.log(testName, curr)
//   //   acc.push({ key: testName, path: curr })
//   // }
// })
