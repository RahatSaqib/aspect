/* eslint-disable import/no-dynamic-require */
const fs = require('fs')
const _ = require('lodash')
const path = require('path')

const dict = []

function formDictionary() {
  const directory = path.join(__dirname, 'formsDefinition/')
  const files = fs.readdirSync(directory, { encoding: 'utf8' })
  _.each(files, fileName => {
    const form = require(`./formsDefinition/${fileName}`)
    const externalId = fileName.replace('.json', '')
    dict[externalId] = form
  })
}
formDictionary()
module.exports = dict
