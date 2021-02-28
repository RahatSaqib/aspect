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
  '--alto-2': '#d8d8d8',

  '--atlantis': '#73d449',
  '--black': '#000000',
  '--blizzard-blue': '#a4e6f2',

  '--carnation': '#f45b69',
  '--cornflower-blue': '#4687f4',
  '--eastern-blue': '#21A0B0',
  '--eastern-blue-2': '#20A1B3',
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
  '--wild-sand': '#f0f0f0',

  // Colors 2020
  '--apple-green': '#439B45',
  '--azure-radiance': '#0091ff',
  '--chathams-blue': '#18527d',
  '--conifer': '#99D25D',
  '--dusty': '#979797',
  '--foam': '#f6fcfe',
  '--gallery': '#ececec',
  '--geyser': '#CCDBE1',
  '--even-red': '#FF0000',
  '--golden-dream': '#EED22A',
  '--guardsman-red': '#d60000',
  '--humming-bird': '#d4f3f9',
  '--iron-2': '#e6e7e9',
  '--lavender': '#d38ae7',
  '--malibu': '#7fc4fa',
  '--saffron': '#f0bc2c',
  '--steel-blue': '#5290c1',
  '--thunderbird': '#DB2F17',
  '--tundora': '#454545',
  '--your-pink': '#ffc9c4',
  '--malachite': '#00ca1c',
  '--web-orange': '#FEA500',
  '--web-orange-2': '#FFD970',

  // Assay hues Abbot
  '--selective-yellow-2': '#3a0000',
  '--lightning-yellow': '#4c2000',
  '--saffron2': '#633800',
  '--saffron-mango': '#7e5000',
  '--goldenrod': '#9b6900',
  '--sweet-corn': '#c98f00',
  '--cherokee': '#ffc928',
  '--cape-honey': '#fff155',

  // Assay hues BD
  '--pirate-gold': '#2e3b3f',
  '--chelsea-gem': '#97a6ab',

  // Assay hues GenoType
  '--geno-lavender1': '#380039',
  '--geno-lavender2': '#580057',
  '--geno-lavender3': '#780f74',
  '--geno-lavender4': '#902e8b',
  '--geno-lavender5': '#aa48a4',
  '--geno-lavender6': '#c460bc',
  '--geno-lavender7': '#de79d6',
  '--geno-lavender8': '#f792f1',
  '--geno-lavender9': '#ffb8ff',

  // Assay hues GeneXpert
  '--genex-blue1': '#00142b',
  '--genex-blue2': '#102239',
  '--genex-blue3': '#203049',
  '--genex-blue4': '#2f3f59',
  '--genex-blue5': '#3f4e69',
  '--genex-blue6': '#505e7a',
  '--genex-blue7': '#606e8b',
  '--genex-blue8': '#717f9d',
  '--genex-blue9': '#8291af',
  '--genex-blue10': '#94a2c1',
  '--genex-blue11': '#a6b4d4',
  '--genex-blue12': '#b8c7e7',
  '--genex-blue13': '#cbdafa',
  '--genex-blue14': '#dfeeff,',

  // Assay hues COVID
  '--sea-nymph': '#0f3328',
  '--summer-green': '#33574b',
  '--summer-green2': '#597e70',
  '--opal': '#81a799',
  '--opal2': '#aad3c3',
  '--conch': '#d7fff0',

  // Assay hues reporter
  '--hot-pink': '#73004b',
  '--carnation-pink': '#ce2099',
  '--cotton-candy': '#ffb5ff',

  // Assay hues Alere
  '--anakiwa': '#004759',
  '--oyster-bay': '#40c1d4',

  // Assay hues Senaite
  '--texas-rose': '#723800',
  '--chardonnay': '#c77f23',
  '--frangipani': '#ffda7c',

  // Assay hues ungrouped
  '--loblolly': '#b8c6cb',
  '--hit-gray': '#a3b0b4',
  '--regent-gray': '#8f9a9e',
  '--rolling-stone': '#7a8487',

  // Genrally used variables throughout the app
  '--aspect-color-cyan': 'var(--scooter, #3cc0cd)',
  '--aspect-color-brink': 'var(--froly, #f36283)',
  '--aspect-color-black': 'var(--black, #000000)',
  '--aspect-color-black-2': 'var(--mine-shaft, #333333)',
  '--aspect-color-blue-1': 'var(--cornflower-blue, #4687f4)',
  '--aspect-color-chill-blue-1': 'var(--ming, #34717c)',
  '--aspect-color-chill-blue-2': 'var(--paradiso, #3e8f98)',
  '--aspect-color-chill-blue-3': 'var(--tradewind, #67abb4)',
  '--aspect-color-conifer': 'var(--conifer, #99D25E)',
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
  '--aspect-color-mandy-2': 'var(--carnation, #EB6562)',
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

  // Operational Data screen
  '--aspect-device-active': '#99D25D',
  '--aspect-device-inactive': '#D8D8D8',
  '--aspect-device-no-samples': '#CCDCE1',
  '--aspect-device-error': '#FF2000',
  '--aspect-device-transfer-time': '#99D7EF',
  '--aspect-device-weekend': '#F4F4F4',
  '--aspect-device-aspect': '#20A1B3',
  '--aspect-device-titles': '#06C4E3',
  // for `inactive*` device statuses
  '--aspect-device-inactiveUnknown': '#454545',
  '--aspect-device-inactiveConnectivity': '#EB6562',
  '--aspect-device-inactiveDecommissioned': '#7d96bb',
  '--aspect-device-inactiveDownForRepair': '#DB3018',
  '--aspect-device-inactiveNoResultsReported': '#6d6f7d',
  '--aspect-device-inactiveOutOfInventory': '#0088aa',
  '--aspect-device-inactiveNoStaff': '#f57c00',
  '--aspect-device-inactiveNoPower': '#ffbe7d',
  '--aspect-device-inactiveOther': '#bf01c5',

  // commenting 'var(--white, #ffffff)' for now because after upgrade Chip component
  // in web/src/components/shared/TagInput.jsx crashes page and shows error in console
  // ---------------
  // Error: Material-UI: unsupported `var(--white, #ffffff)` color.
  // We support the following formats: #nnn, #nnnnnn, rgb(), rgba(), hsl(), hsla().
  // at decomposeColor (colorManipulator.js?c029:120)
  // at fade (colorManipulator.js?c029:227)
  // at styles (Chip.js?e831:253)
  // at Object.create (getStylesCreator.js?8015:29)
  // at WithStyles.createSheet (withStyles.js?1e4f:277)
  // at WithStyles.attach (withStyles.js?1e4f:256)
  // at new WithStyles(Chip) (withStyles.js?1e4f:138)
  // ---------------
  // '--aspect-color-white': 'var(--white, #ffffff)',
  '--aspect-color-white': '#ffffff',

  '--aspect-color-white-2': 'var(--wild-sand, #f6f6f6)',
  '--aspect-color-white-3': 'var(--alto, #e0e0e0)',
  '--aspect-color-white-4': 'var(--gallery, #ececec)',

  '--aspect-button-accent-color': 'var(--venice-blue, #084482)',

  // Font Size
  '--aspect-font-size-sm': '14px',
  '--aspect-font-size-md': '16px',
  '--aspect-font-size-lg': '24px',

  '--aspect-button-border-radius': '3px',

  initialised: true, // only for test runner to work
}

exports.definePluginVariables = transform(
  exports.customPropertiesVariables,
  (result, value, key) =>
    // Transform key into the form like: process.env['--aspect-color-cyan']
    set(result, `process.env['${key}']`, JSON.stringify(value)),
  {}
)
