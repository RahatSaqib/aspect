const { stat: dashboardWidgetsBase } = require('../../fixtures/dashboardWidgetsCommon')
const {
  stat: { totalModuleBays, activeModuleBays },
} = require('../../fixtures/dashboardWidgets')

// This widget is based on the assumption, valid only for Bangladesh,
// that any device with at least one XDR result is a fully 10c device.
const moduleVersionWidget = {
  jobFunctions: ['all'],
  icon: 'MdViewModule',
  title: 'Module Version',
  titleI18nKey: 'moduleVersionWidget',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: '',
  sortOrder: 0,
  externalId: 'bangladeshModuleVersions',
  description: 'Number of 6-color and 10-color GeneXpert modules.',
  descriptionI18nKey: 'countOf6cAnd10cModules',
  dashboards: {
    home: {},
  },
}

const disabledModulesWidget = {
  jobFunctions: ['all'],
  icon: 'MdViewModule',
  title: 'Non functional/Disabled Modules',
  titleI18nKey: 'disabledModulesWidget',
  subTitle: null,
  subTitleI18nKey: null,
  sqlForIndicator: '',
  sortOrder: 0,
  externalId: 'disabledModules',
  description: 'Count of Distinct Disabled GeneXpert Modules.',
  descriptionI18nKey: 'countOfDistinctDisabledGeneXpertModules',
  dashboards: {
    home: {},
  },
}

module.exports = {
  stat: {
    ...dashboardWidgetsBase,
    totalModuleBays,
    activeModuleBays,
    moduleVersionWidget,
    disabledModulesWidget,
  },
}
