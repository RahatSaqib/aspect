const transform = require('lodash/transform')
const set = require('lodash/set')
/**
 * To see an example of usage please see
 * "web/src/dashboard/status/ColorDemo/ColorDemo.jsx"
 *
 * NB: Any changes to this file needs a restart of the web
 * dev environment.
 */

exports.customPropertiesVariables = {
  // Colors 2019
  '--alto': '#e0e0e0',
  '--atlantis': '#73d449',
  '--black': '#000000',
  '--blizzard-blue': '#a4e6f2',
  '--carnation': '#f45b69',
  '--cornflower-blue': '#4687f4',
  '--french-gray': '#b7b7be',
  '--froly': '#f36283',
  '--feijoa': '#aed581',
  '--iron': '#dadbdf',
  '--mako': '#444853',
  '--manatee': '#91949d',
  '--mandy': '#e75164',
  '--mandy-3': '#e85164',
  '--mine-shaft': '#333333',
  '--ming': '#34717c',
  '--mercury': '#e6e6e6',
  '--my-sin': '#fcb124',
  '--paradiso': '#3e8f98',
  '--picton-blue': '#44d0e7',
  '--purple-mountains-majesty': '#9874b2',
  '--robins-egg-blue': '#00c4e0',
  '--scooter': '#3cc0cd',
  '--scooter-2': '#41aeda',
  '--selective-yellow': '#ffb300',
  '--ship-cove': '#7d96bb',
  '--silver': '#bfbfbf',
  '--silver-chalice': '#9e9e9e',
  '--silver-3': '#cccccc',
  '--silver-4': '#bfbfbf',
  '--spray': '#74dded',
  '--storm-gray': '#6d6f7d',
  '--sushi': '#7cb342',
  '--tradewind': '#67abb4',
  '--tuna': '#363844',
  '--venice-blue': '#084482',
  '--white-lilac': '#eef1f8',
  '--white-lilac-2': '#f6f7fb',
  '--white': '#ffffff',
  '--wild-sand': '#f6f6f6',

  // Colors 2020
  '--azure-radiance': '#0091ff',
  '--chathams-blue': '#18527d',
  '--gallery': '#ececec',
  '--guardsman-red': '#d60000',
  '--humming-bird': '#d4f3f9',
  '--iron-2': '#e6e7e9',
  '--lavender': '#d38ae7',
  '--malibu': '#7fc4fa',
  '--saffron': '#f0bc2c',
  '--steel-blue': '#5290c1',
  '--your-pink': '#ffc9c4',
  '--malachite': '#00ca1c',

  // Genrally used variables throughout the app
  '--aspect-color-cyan': 'var(--scooter, #3cc0cd)',
  '--aspect-color-brink': 'var(--froly, #f36283)',
  '--aspect-color-black': 'var(--black, #000000)',
  '--aspect-color-black-2': 'var(--mine-shaft, #333333)',
  '--aspect-color-blue-1': 'var(--cornflower-blue, #4687f4)',
  '--aspect-color-chill-blue-1': 'var(--ming, #34717c)',
  '--aspect-color-chill-blue-2': 'var(--paradiso, #3e8f98)',
  '--aspect-color-chill-blue-3': 'var(--tradewind, #67abb4)',
  '--aspect-color-feijoa': 'var(--feijoa, #aed581)',
  '--aspect-color-grey-1': 'var(--tuna, #363844)',
  '--aspect-color-grey-2': 'var(--mako, #444853)',
  '--aspect-color-grey-3': 'var(--storm-gray, #6d6f7d)',
  '--aspect-color-grey-4': 'var(--manatee, #91949d)',
  '--aspect-color-grey-5': 'var(--french-gray, #b7b7be)',
  '--aspect-color-grey-6': 'var(--iron, #dadbdf)',
  '--aspect-color-grey-7': 'var(--white-lilac, #eef1f8)',
  '--aspect-color-grey-8': 'var(--white-lilac-2, #f6f7fb)',
  '--aspect-color-grey-9': 'var(--mercury, #e6e6e6)',
  '--aspect-color-mandy': 'var(--guardsman-red, #d60000)',
  '--aspect-color-mandy-2': 'var(--carnation, #f45b69)',
  '--aspect-color-mandy-3': 'var(--mandy-3,  #e85164)',
  '--aspect-color-mantis': 'var(--malachite, #00ca1c)',
  '--aspect-color-mountain': 'var(--purple-mountains-majesty, #9874b2)',
  '--aspect-color-pink': 'var(--your-pink, #ffc9c4)',
  '--aspect-color-scooter-blue-1': 'var(--robins-egg-blue, #00c4e0)',
  '--aspect-color-scooter-blue-2': 'var(--picton-blue, #44d0e7)',
  '--aspect-color-scooter-blue-3': 'var(--spray, #74dded)',
  '--aspect-color-scooter-blue-4': 'var(--blizzard-blue, #a4e6f2)',
  '--aspect-color-shakespeare': 'var(--scooter-2, #41aeda)',
  '--aspect-color-ship-cove': 'var(--ship-cove, #7d96bb)',
  '--aspect-color-silver': 'var(--silver-chalice: #9e9e9e)',
  '--aspect-color-silver-2': 'var(--silver: #bfbfbf)',
  '--aspect-color-silver-3': 'var(--silver-3: #cccccc)',
  '--aspect-color-silver-4': 'var(--silver-4: #bfbfbf)',
  '--aspect-color-supernova': 'var(--saffron, #f0bc2c)',
  '--aspect-color-supernova-2': 'var(--my-sin, #fcb124)',
  '--aspect-color-sushi': 'var(--sushi, #7cb342)',
  '--aspect-color-white': 'var(--white, #ffffff)',
  '--aspect-color-white-2': 'var(--wild-sand, #f6f6f6)',
  '--aspect-color-white-3': 'var(--alto, #e0e0e0)',
  '--aspect-color-white-4': 'var(--gallery, #ececec)',

  '--aspect-button-accent-color': 'var(--venice-blue, #084482)',

  // Font Size
  '--aspect-font-size-sm': '14px',
  '--aspect-font-size-md': '16px',
  '--aspect-font-size-lg': '24px',

  '--aspect-button-border-radius': '3px',
}

exports.definePluginVariables = transform(
  exports.customPropertiesVariables,
  (result, value, key) =>
    // Transform key into the form like: process.env['--aspect-color-cyan']
    set(result, `process.env['${key}']`, JSON.stringify(value)),
  {}
)
