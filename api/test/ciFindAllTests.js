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

function arrayAllTests({ path }) {
  if (!isMocha(global)) {
    findAllTests(path)
    return JSON.stringify(files, null, 2)
  }
}

function constructMochaCommand({ files }) {
  const filesArr = JSON.parse(files)
  _.map(_.chunk(filesArr, filesArr.length / 3), chunk =>
    strings.push(`test/{${_.join(chunk, ',')}}/*.spec.js`)
  )
  return strings
}

module.exports = {
  constructMochaCommand,
  arrayAllTests,
}

// require('make-runnable')
require('make-runnable/custom')({
  printOutputFrame: false,
})

// '["report","clinicalIndicators","followUpAggregations","result","resultComments","resultCreateUpdate","resultDownload","resultFollowUps","resultJobContext","resultPatient","resultTransfer","resultTreatment","resultTypes","resultWorkflow","taskTracker","server","server","reporters","site","smsMq","tag","task","webhookMq"]'
