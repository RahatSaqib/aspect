const _ = require('lodash')

exports.customPropertiesVariables = {
  '--aspect-color-cyan': '#3cc0cd',

  '--aspect-color-scooter-blue-1': '#00c4e0',
  '--aspect-color-scooter-blue-2': '#44d0e7',
  '--aspect-color-scooter-blue-3': '#74dded',
  '--aspect-color-scooter-blue-4': '#a4e6f2',

  '--aspect-color-chill-blue-1': '#34717c',
  '--aspect-color-chill-blue-2': '#3e8f98',

  '--aspect-color-grey-1': '#363844',
  '--aspect-color-grey-2': '#444853',
  '--aspect-color-grey-3': '#6d6f7d',
  '--aspect-color-grey-4': '#91949d',
  '--aspect-color-grey-5': '#b7b7be',
  '--aspect-color-grey-6': '#dadbdf',
  '--aspect-color-grey-7': '#eef1f8',
  '--aspect-color-grey-8': '#f6f7fb',

  '--aspect-color-mantis': '#73d449',
  '--aspect-color-supernova': '#ffb300',
  '--aspect-color-mandy': '#e75164',

  '--aspect-color-ship-cove': '#7d96bb',
  '--aspect-color-shakespeare': '#41aeda',
  '--aspect-color-mountain': '#9874b2',
  '--aspect-color-brink': '#f36283',
}

exports.definePluginVariables = _.transform(
  exports.customPropertiesVariables,
  (result, value, key) =>
    // Transform key into the form like: process.env['--aspect-color-cyan']
    _.set(result, `process.env['${key}']`, JSON.stringify(value)),
  {}
)
