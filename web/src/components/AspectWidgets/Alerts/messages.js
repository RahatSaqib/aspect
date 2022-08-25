import { defineMessages } from 'react-intl'

const messagesByOperators = defineMessages({
  greaterThan: {
    id: 'widgetAlerts.greaterThan',
    defaultMessage: 'The {representing} is greater than {comparedTo}',
  },
  lessThan: {
    id: 'widgetAlerts.lessThan',
    defaultMessage: 'The {representing} is less than {comparedTo}',
  },
  between: {
    id: 'widgetAlerts.between',
    defaultMessage: 'The {representing} is between {comparedToFrom} and {comparedToTo}',
  },
  containedIn: {
    id: 'widgetAlerts.containerIn',
    defaultMessage: 'The {representing} is one of {comparedTo}',
  },
})

const valueRepresentations = defineMessages({
  percentageOfActiveDevices: {
    id: 'widgetAlerts.percentageOfActiveDevices',
    defaultMessage: 'percentage of active devices',
  },
  averageHoursToUpload: {
    id: 'widgetAlerts.averageHoursToUpload',
    defaultMessage: 'average hours to upload',
  },
  percentageOfServerUptime: {
    id: 'widgetAlerts.percentageOfServerUptime',
    defaultMessage: 'percentage of server uptime',
  },
  percentageOfPositiveResultsNotified: {
    id: 'widgetAlerts.percentageOfPositiveResultsNotified',
    defaultMessage: 'percentage of positive results notified',
  },
  averageLengthOfSMS: {
    id: 'widgetAlerts.averageLengthOfSMS',
    defaultMessage: 'average length of SMS',
  },
  numberOfTextMessagesSent: {
    id: 'widgetAlerts.numberOfTextMessagesSent',
    defaultMessage: 'number of text messages sent',
  },
  utilizationRate: {
    id: 'widgetAlerts.utilizationRate',
    defaultMessage: 'utilization rate',
  },
  percentageOfValidResults: {
    id: 'widgetAlerts.percentageOfValidResults',
    defaultMessage: 'percentage of valid results',
  },
  errorRate: {
    id: 'widgetAlerts.errorRate',
    defaultMessage: 'error rate',
  },
  percentageOfStockouts: {
    id: 'widgetAlerts.percentageOfStockouts',
    defaultMessage: 'percentage of active sites experiencing stockouts',
  },
  percentageOfSitesWithoutGxStockEntered: {
    id: 'widgetAlerts.percentageOfSitesWithoutGxStockEntered',
    defaultMessage: 'percentage of sites that never entered stock of GeneXpert assays',
  },
  averageDurationOfServiceInterrumption: {
    id: 'widgetAlerts.averageDurationOfServiceInterrumption',
    defaultMessage: 'average days of service interrumption',
  },
  averageDaysForInstrumentReplacement: {
    id: 'widgetAlerts.averageDaysForInstrumentReplacement',
    defaultMessage: 'average days for instrument replacement',
  },
  averageDaysBetweenModuleSwaps: {
    id: 'widgetAlerts.averageDaysBetweenModuleSwaps',
    defaultMessage: 'average days between module swaps',
  },
  averageTimeToReplaceDisabledModules: {
    id: 'widgetAlerts.averageTimeToReplaceDisabledModules',
    defaultMessage: 'average time to replace disabled modules',
  },
  percentageOfDevicesWithUnusedModules: {
    id: 'widgetAlerts.percentageOfDevicesWithUnusedModules',
    defaultMessage: 'percentage of devices with unused modules',
  },
  averageDaysOfServiceInterruption: {
    id: 'widgetAlerts.averageDaysOfServiceInterruption',
    defaultMessage: 'percentage of devices service interruption',
  },
  percentageOfModulesFunctioning: {
    id: 'widgetAlerts.percentageOfModulesFunctioning',
    defaultMessage: 'percentage of modules functioning',
  },
  defaultMessage: {
    id: 'widgetAlerts.defaultMessage',
    defaultMessage: 'indicator',
  },
})

const format = (formatFunc, { whenIs, representing: representingKey, comparedTo }) => {
  let comparisonStrings

  switch (whenIs) {
    case 'between':
      comparisonStrings = {
        comparedToFrom: comparedTo[0],
        comparedToTo: comparedTo[1],
      }
      break
    case 'containedIn':
      comparisonStrings = {
        comparedTo: comparedTo.join(', '),
      }
      break
    default:
      comparisonStrings = { comparedTo }
      break
  }

  const representing = formatFunc(valueRepresentations[representingKey] || valueRepresentations.defaultMessage)

  return formatFunc(messagesByOperators[whenIs], {
    representing,
    ...comparisonStrings,
  })
}

export default format
