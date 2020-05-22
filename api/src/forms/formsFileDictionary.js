/* eslint-disable import/no-dynamic-require */
const fs = require('fs')
const _ = require('lodash')

const dict = []

function formDictionary(){
  const files = fs.readdirSync('./formsDefinition/',{encoding:'utf8'})
  _.each(files,fileName=>{
    const form = require(`./formsDefinition/${fileName}`)
    const externalId=fileName.replace('.json','')
    dict[externalId]=form
  })
}
formDictionary()
module.exports = dict
