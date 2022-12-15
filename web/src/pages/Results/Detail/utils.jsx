import uniqBy from 'lodash/uniqBy'
import * as Yup from 'yup'
import { getInitialValuesFromFormConfig, mergeFormConfigWithData } from '../../../components/Form/Formik/Helpers'
import getFormConfig from '../Forms/editConfig'
import getValidationSchema from '../Forms/validation'
import messages from './messages'

export const getFormConfigWithData = (intl, isNew, values) => {
  const formSchema = getFormConfig(intl.formatMessage, isNew, values.assay)

  const customFields = formSchema.sections.find(({ id }) => id === 'CustomFields')
  if (customFields) {
    customFields.rows = getRowsForCustomFields(values, intl)
  }

  let validationSchema = getValidationSchema(intl.formatMessage)
  if (customFields) {
    validationSchema = validationSchema.shape(getValidationsForCustomFields(values, intl))
  }

  const initialValues = getInitialValuesFromFormConfig(formSchema, values)

  return {
    ...mergeFormConfigWithData(initialValues, formSchema, messages),
    validationSchema,
    values: initialValues,
  }
}

function getValidationsForCustomFields(values, { formatMessage }) {
  const rows = {}

  const totalCustomFields = values.customFieldsValues?.length || 0

  if (totalCustomFields === 0) {
    return rows
  }

  uniqBy(values.customFieldsValues, elem => elem.externalId).forEach(customField => {
    // just as a mock of the real response
    customField = transformCustomField(customField)

    const source = customField.source.split('.')
    const dataOrigin = source[0]
    const dataField = source[1]

    if (!Object.keys(rows).includes(dataOrigin)) {
      rows[dataOrigin] = Yup.object({})
    }

    if (customField.type === 'select') {
      // add validation for select
    } else if (customField.type === 'textbox') {
      // add validation for text
    } else if (customField.type === 'numberbox') {
      rows[dataOrigin] = rows[dataOrigin].shape({
        [dataField]: Yup.number()
          .required(formatMessage(messages[customField.validation[0].i18nKey]))
          .positive()
          .integer()
          .min(customField.validation[0].min)
          .max(customField.validation[0].max),
      })
    }
  })

  return rows
}

function getRowsForCustomFields(values, { formatMessage }) {
  const totalCustomFields = values.customFieldsValues?.length || 0
  const id = 9000
  if (totalCustomFields === 0) {
    return [{ id, items: [{ controlType: { component: 'textField' }, labelI18nKey: 'noCustomFieldsDefined' }] }]
  }
  let rows = []
  // show 3 cells per row
  const cellsPerRow = 3
  let row = {}

  uniqBy(values.customFieldsValues, elem => elem.externalId).forEach((customField, index) => {
    // start new row
    if (index % cellsPerRow === 0) {
      if (index > 0) {
        rows = [...rows, row]
      }
      row = {
        id: id + index,
        items: [],
      }
    }
    // just as a mock of the real response
    customField = transformCustomField(customField)

    const source = customField.source.split('.')
    if (customField.type === 'select') {
      row.items = [
        ...row.items,
        {
          id: customField.i18nKeyCaption,
          label: formatMessage(messages[customField.i18nKeyCaption]),
          initialValue: values[source[0]][source[1]] ? [values[source[0]][source[1]].toLowerCase()] : [],
          controlType: {
            component: 'select',
            options: customField.items
              .sort((a, b) => a.order - b.order)
              .map(i => ({ value: i.value.toLowerCase(), label: formatMessage(messages[i.i18nKeyValue]) })),
          },
        },
      ]
    } else if (customField.type === 'textbox') {
      row.items = [
        ...row.items,
        {
          id: customField.externalId || `${source[0]}.${source[1]}`,
          controlType: { component: 'textField' },
          labelI18nKey: customField.i18nKeyCaption,
        },
      ]
    } else if (customField.type === 'numberbox') {
      row.items = [
        ...row.items,
        {
          id: customField.externalId || `${source[0]}.${source[1]}`,
          controlType: {
            component: 'numberField',
            min: customField.validation[0].min,
            max: customField.validation[0].max,
          },
          labelI18nKey: customField.i18nKeyCaption,
        },
      ]
    }
  })

  return rows
}

const transformCustomField = customField => {
  switch (customField.externalId) {
    case 'patientData.gender':
      customField = {
        type: 'select',
        i18nKeyCaption: 'Genderi18nCaptionKey',
        source: 'patientData.gender',
        items: [
          { key: 1, value: 'Male', i18nKeyValue: 'male', order: 0 },
          { key: 0, value: 'Female', i18nKeyValue: 'female', order: 10 },
        ],
      }
      break
    case 'patientData.age':
      customField = {
        type: 'numberbox',
        i18nKeyCaption: 'AgeFieldi18nKey',
        source: 'patientData.age',
        validation: [{ min: 0, max: 150, i18nKey: 'AgeValidationFieldi18nKey' }],
      }
      break
    case 'patientData.retreatmentCase':
      customField = {
        type: 'select',
        i18nKeyCaption: 'RetreatCaseFieldi18nKey',
        source: 'patientData.retreatmentCase',
        items: [
          { key: 1, value: 'Yes', i18nKeyValue: 'yes', order: 0 },
          { key: 0, value: 'No', i18nKeyValue: 'no', order: 10 },
        ],
      }
      break
    case 'patientData.referringClinicianOrFacilityPhoneNumberIfKnown':
      customField = {
        type: 'textbox',
        i18nKeyCaption: 'Referringphonei18nKeyCaption',
        source: 'patientData.referringClinicianOrFacilityPhoneNumberIfKnown',
      }
      break
    case 'patientData.referringFacility':
      customField = {
        type: 'textbox',
        i18nKeyCaption: 'ReferringFacilityI18nkey',
        source: 'patientData.ReferringFacility',
      }
      break
    case 'patientData.repeatTest':
      customField = {
        type: 'select',
        i18nKeyCaption: 'RepeatTesti18nKey',
        source: 'patientData.repeatTest',
        items: [
          { key: 0, value: 'First or second', i18nKeyValue: 'firstOrSecond', order: 0 },
          { key: 1, value: 'Follow-up', i18nKeyValue: 'followUp', order: 10 },
          { key: 2, value: 'Repeat Baseline', i18nKeyValue: 'repeatBaseline', order: 20 },
        ],
      }
      break
    case 'patientData.patientName':
      customField = {
        type: 'textbox',
        i18nKeyCaption: 'PatientNameI18nCaptionKey',
        source: 'patientData.name',
      }
      break
    case 'patientData.address':
      customField = {
        type: 'textbox',
        i18nKeyCaption: 'AddressI18nCaptionKey',
        source: 'patientData.address',
      }
      break
    case 'patientData.mobileNumber':
      customField = {
        type: 'textbox',
        i18nKeyCaption: 'MobileNumberI18nkey',
        source: 'patientData.PatientPhone',
      }
      break
    case 'patientData.typeOfPatient':
      customField = {
        type: 'select',
        i18nKeyCaption: 'TypeOfPatientI18nKey',
        source: 'patientData.TypeOfPatient',
        items: [
          {
            key: 'Failures_of_Category_I',
            value: 'Failures of Category I',
            i18nKeyValue: 'Failures_of_Category_I',
            order: 0,
          },
          {
            key: 'Non_converters_of_Category_I',
            value: 'Non converters of Category I',
            i18nKeyValue: 'Non_converters_of_Category_I',
            order: 10,
          },
          {
            key: 'Failures_of_Retreatment',
            value: 'Failures of Retreatment',
            i18nKeyValue: 'Failures_of_Retreatment',
            order: 20,
          },
          {
            key: 'Non_converters_of_Retreatment',
            value: 'Non converters of Retreatment',
            i18nKeyValue: 'Non_converters_of_Retreatment',
            order: 30,
          },
          { key: 'Relapses', value: 'Relapses', i18nKeyValue: 'Relapses', order: 40 },
          {
            key: 'Treatment_after_loss_to_follow_up',
            value: 'Treatment after loss to follow up',
            i18nKeyValue: 'Treatment_after_loss_to_follow_up',
            order: 50,
          },
          {
            key: 'Close_contacts_of_DR_TB_patient_with_symptoms',
            value: 'Close contacts of DR TB patient with symptoms',
            i18nKeyValue: 'Close_contacts_of_DR_TB_patient_with_symptoms',
            order: 60,
          },
          {
            key: 'HIV_infected_person_with_TB_SS',
            value: 'HIV infected person, with TB S/S',
            i18nKeyValue: 'HIV_infected_person_with_TB_SS',
            order: 70,
          },
          {
            key: 'Others_Pulmonary_clinically_diagnosed',
            value: 'Others - Pulmonary, clinically diagnosed',
            i18nKeyValue: 'Others_Pulmonary_clinically_diagnosed',
            order: 80,
          },
          {
            key: 'Others_Extra_Pulmonary',
            value: 'Others - Extra Pulmonary',
            i18nKeyValue: 'Others_Extra_Pulmonary',
            order: 81,
          },
          {
            key: 'Others_Pulmonary_Bacteriologically_Confirmed',
            value: 'Others - Pulmonary, Bacteriologically Confirmed',
            i18nKeyValue: 'Others_Pulmonary_Bacteriologically_Confirmed',
            order: 82,
          },
          {
            key: 'Presumptive_Pulmonary_Smear_Negative_TB_Cases',
            value: 'Presumptive Pulmonary Smear Negative TB Cases',
            i18nKeyValue: 'Presumptive_Pulmonary_Smear_Negative_TB_Cases',
            order: 90,
          },
          { key: 'Presumptive_TB', value: 'Presumptive TB', i18nKeyValue: 'Presumptive_TB', order: 95 },
        ],
      }
      break
    case 'patientData.patientHistory':
      customField = {
        type: 'select',
        i18nKeyCaption: 'PatientHistoryI18nKey',
        source: 'patientData.PatientHistory',
        items: [
          {
            key: 'unknown',
            value: 'Unknown history',
            i18nKeyValue: 'unknown',
            order: 0,
            scope: [
              'Close_contacts_of_DR_TB_patient_with_symptoms',
              'HIV_infected_person_with_TB_SS',
              'Others_Pulmonary_clinically_diagnosed',
              'Others_Extra_Pulmonary',
              'Others_Pulmonary_Bacteriologically_Confirmed',
              'Presumptive_Pulmonary_Smear_Negative_TB_Cases',
              'Presumptive_TB',
            ],
          },
          {
            key: 'new',
            value: 'New',
            i18nKeyValue: 'new',
            order: 10,
            scope: [
              'Close_contacts_of_DR_TB_patient_with_symptoms',
              'HIV_infected_person_with_TB_SS',
              'Others_Pulmonary_clinically_diagnosed',
              'Others_Extra_Pulmonary',
              'Others_Pulmonary_Bacteriologically_Confirmed',
              'Presumptive_Pulmonary_Smear_Negative_TB_Cases',
              'Presumptive_TB',
            ],
          },
          {
            key: 'treated',
            value: 'Previously treated',
            i18nKeyValue: 'treated',
            order: 20,
            scope: [
              'Close_contacts_of_DR_TB_patient_with_symptoms',
              'HIV_infected_person_with_TB_SS',
              'Others_Pulmonary_clinically_diagnosed',
              'Others_Extra_Pulmonary',
              'Presumptive_Pulmonary_Smear_Negative_TB_Cases',
            ],
          },
        ],
      }
      break
    case 'patientData.patientRetreatment':
      customField = {
        type: 'select',
        i18nKeyCaption: 'PatientRetreatmentI18nKey',
        source: 'patientData.PatientRetreatment',
        items: [
          { key: 'Category-I', value: 'Category I', i18nKeyValue: 'Category-I', order: 0 },
          { key: 'Retreatment', value: 'Retreatment', i18nKeyValue: 'Retreatment', order: 10 },
        ],
      }
      break
    case 'patientData.hivStatus':
      customField = {
        type: 'select',
        i18nKeyCaption: 'HIVStatusI18nKey',
        source: 'patientData.HIVStatus',
        items: [
          { key: 'positive', value: 'Positive', i18nKeyValue: 'positive', order: 10 },
          { key: 'negative', value: 'Negative', i18nKeyValue: 'negative', order: 20 },
          { key: 'unknown', value: 'Unknown', i18nKeyValue: 'unknown', order: 99 },
        ],
      }
      break
    case 'patientData.sampleType':
      customField = {
        type: 'select',
        i18nKeyCaption: 'SampleTypeI18nKey',
        source: 'patientData.SampleType',
        items: [
          { key: 'pulmonary', value: 'Pulmonary', i18nKeyValue: 'pulmonary', order: 10 },
          { key: 'extra', value: 'Extra-pulmonary', i18nKeyValue: 'extra', order: 20 },
        ],
      }
      break
    case 'patientData.tbRegistrationNumberPrevious':
      customField = {
        type: 'textbox',
        i18nKeyCaption: 'TBRegistrationNumberPreviousI18nKey',
        source: 'patientData.tbRegistrationNumberPrevious',
      }
      break
    case 'patientData.tbRegistrationNumberCurrent':
      customField = {
        type: 'textbox',
        i18nKeyCaption: 'TBRegistrationNumberCurrentI18nKey',
        source: 'patientData.tbRegistrationNumberCurrent',
      }
      break

    default:
  }

  return customField
}

export default getFormConfigWithData
