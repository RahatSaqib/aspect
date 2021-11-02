/* eslint-disable import/no-dynamic-require */
const fs = require('fs')
const _ = require('lodash')
const path = require('path')

const dict = {}
const getFileUpdatedDate = path => {
  const { mtime } = fs.statSync(path)
  return mtime
}
function formDictionary() {
  const directory = path.join(__dirname, 'formsDefinition/')

  const files = fs.readdirSync(directory, { encoding: 'utf8' })
  _.each(files, fileName => {
    const fullPath = path.join(__dirname, 'formsDefinition/', fileName)
    const form = require(`./formsDefinition/${fileName}`)
    form.updatedOn = getFileUpdatedDate(fullPath)
    dict[fileName.replace('.json', '')] = form
  })
}
formDictionary()
module.exports = dict
