import variables from '../../../../../cfg/variables.js'

const envSource =
  process.env && process.env.initialised
    ? process.env
    : Object.assign(process.env, variables.customPropertiesVariables)

const {
  '--alto-2': alto2,
  '--anakiwa': anakiwa,
  '--aspect-color-black': colorBlack,
  '--aspect-color-mandy': colorMandy,
  '--aspect-color-mandy-2': colorMandy2,
  '--aspect-color-mantis': colorMantis,
  '--aspect-color-pink': colorPink,
  '--aspect-color-scooter-blue-4': colorBlue4,
  '--aspect-color-supernova': colorSuperNova,
  '--aspect-color-supernova-2': colorSuperNova2,
  '--aspect-color-white-4': colorWhite4,
  '--conifer': conifer,
  '--eastern-blue': easternBlue,
  '--geyser': geyser,
  '--golden-dream': goldenDream,
  '--wild-sand': wildSand,
  '--purple-mountains-majesty': colorPurple,
  '--tundora': tundora,
  '--thunderbird': thunderbird,
  '--web-orange': webOrange,
} = envSource

const graphColorMap = [
  { id: 1, externalId: 'MoreThan1000', color: colorMandy },
  { id: 2, externalId: 'LessThan1000', color: webOrange },
  { id: 3, externalId: 'LessThan150', color: colorPink },
  { id: 4, externalId: 'LessThan40', color: goldenDream },
  { id: 5, externalId: 'MoreThan40', color: colorPink },
  { id: 6, externalId: 'Detected', color: colorMandy },
  { id: 7, externalId: 'Indeterminate', color: colorPink },
  { id: 8, externalId: 'NotDetected', color: colorMantis },
  { id: 9, externalId: 'Invalid', color: colorWhite4 },
  { id: 10, externalId: 'NoResult', color: colorPink },
  { id: 11, externalId: 'Error', color: tundora },
  { id: 12, externalId: 'Positive', color: colorSuperNova },
  { id: 13, externalId: 'Inconclusive', color: colorPink },
  { id: 14, externalId: 'Unknown', color: colorWhite4 },
  { id: 15, externalId: 'Negative', color: colorMantis },
  { id: 16, externalId: 'died', color: colorMandy },
  { id: 17, externalId: 'recovered', color: colorMantis },
  { id: 18, externalId: 'selfQuarantine', color: colorSuperNova2 },
  { id: 19, externalId: 'quarantine', color: colorSuperNova },
  { id: 20, externalId: 'Male', color: colorBlue4 },
  { id: 21, externalId: 'Female', color: colorPurple },
  { id: 22, externalId: 'Confirmed', color: colorMantis },
  { id: 23, externalId: 'NotConfirmed', color: colorBlue4 },
  { id: 24, externalId: 'devicesActive', color: conifer },
  { id: 25, externalId: 'devicesInactive', color: alto2 },
  { id: 26, externalId: 'weekendOrHoliday', color: wildSand },
  { id: 27, externalId: 'devicesNeedsRepair', color: thunderbird },
  { id: 28, externalId: 'devicesUnknown', color: tundora },
  { id: 29, externalId: 'devicesStockOut', color: anakiwa },
  { id: 30, externalId: 'medianMarker', color: easternBlue },
  { id: 99, externalId: 'Cases', color: colorMantis },
]

export default graphColorMap
