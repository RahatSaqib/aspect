const { EID_TESTING_WINDOW_FIELD, WITHIN_8_WEEKS, AFTER_8_WEEKS } = require('../../result/serviceReportChad/eidReport')

module.exports = {
  fields: [
    {
      id: 50,
      name: EID_TESTING_WINDOW_FIELD,
      title: 'EID testing window',
      i18nKey: 'EIDTestingWindowI18nKey',
      fieldType: 'text',
      completionWeight: 10,
      order: 10,
      gxAlertDbColumn: EID_TESTING_WINDOW_FIELD,
      caption: 'Was the infant tested within 8 weeks of birth?',
      i18nKeyCaption: 'EIDTestingWindowI18nCaptionKey',
      controlType: 'comboBox',
      payloadOriginPath: 'data.customFieldData.50.value',
      source: `patientData.${EID_TESTING_WINDOW_FIELD}`,
      mandatory: true,
      items: [
        {
          key: WITHIN_8_WEEKS,
          value: WITHIN_8_WEEKS,
          order: 10,
        },
        {
          key: AFTER_8_WEEKS,
          value: AFTER_8_WEEKS,
          order: 20,
        },
      ],
    },
  ],
  refForms: [],
}
