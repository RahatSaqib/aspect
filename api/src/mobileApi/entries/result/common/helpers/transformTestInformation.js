const _ = require('lodash')

function transformTestInformation(data) {
  const output = []
  const testInfo1 = _.pick(data, [
    'resultCategory1i18nKey',
    'resultCategory1Label',
    'resultCategory1Name',
    'resultCategory1Emphasize',
    'resultCategory1ValueI18nKey',
  ])
  const testInfo2 = _.pick(data, [
    'resultCategory2i18nKey',
    'resultCategory2Label',
    'resultCategory2Name',
    'resultCategory2Emphasize',
    'resultCategory2ValueI18nKey',
  ])

  if (!_.isEmpty(testInfo1) && !_.isNil(testInfo1.resultCategory1Name) && !_.isEmpty(testInfo1.resultCategory1Name)) {
    output.push({
      resultId: data.id,
      label: testInfo1.resultCategory1Label ?? null,
      labelI18nKey: testInfo1.resultCategory1i18nKey ?? null,
      value: testInfo1.resultCategory1Name ?? null,
      valueI18nKey: testInfo1.resultCategory1ValueI18nKey ?? null,
      severity: testInfo1.resultCategory1Emphasize ? 'danger' : 'info',
    })
  }
  if (!_.isEmpty(testInfo2) && !_.isNil(testInfo2.resultCategory2Name) && !_.isEmpty(testInfo2.resultCategory2Name)) {
    output.push({
      resultId: data.id,
      label: testInfo2.resultCategory2Label ?? null,
      labelI18nKey: testInfo2.resultCategory2i18nKey ?? null,
      value: testInfo2.resultCategory2Name ?? null,
      valueI18nKey: testInfo2.resultCategory2ValueI18nKey ?? null,
      severity: testInfo2.resultCategory2Emphasize ? 'danger' : 'info',
    })
  }
  return output
}

module.exports = { transformTestInformation }
