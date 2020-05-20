/* eslint-disable import/no-dynamic-require */
const fs = require('fs')
const _ = require('lodash')

const dict = []

function formDictionary(){
  const files = fs.readdirSync('./formsSchema/',{encoding:'utf8'})
  _.each(files,fileName=>{
    const form = require(`./formsSchema/${fileName}`)
    dict[form.externalId]=form
  })
}
formDictionary()
module.exports = dict
