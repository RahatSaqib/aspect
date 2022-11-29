/* eslint prettier/prettier: ["error", { "printWidth": 200 }] */
import uniqBy from 'lodash/uniqBy'
import { getInitialValuesFromFormConfig, mergeFormConfigWithData } from '../../../components/Form/Formik/Helpers'
import getFormConfig from '../Forms/editConfig'
import getValidationSchema from '../Forms/validation'
import messages from './messages'

export const getFormConfigWithData = (intl, isNew, values) => {
  const formSchema = getFormConfig(intl.formatMessage, isNew, values.assay)

  const section = formSchema.sections.find(({ id }) => id === 'CustomFields')
  if (section) {
    section.rows = getRowsForCustomFields(values, intl)
  }

  const validationSchema = getValidationSchema(intl.formatMessage)
  const initialValues = getInitialValuesFromFormConfig(formSchema, values)

  return {
    ...mergeFormConfigWithData(initialValues, formSchema, messages),
    validationSchema,
    values: initialValues,
  }
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

    if (customField.items) {
      row.items = [
        ...row.items,
        {
          id: customField.i18nKeyCaption,
          label: formatMessage(messages[customField.i18nKeyCaption]),
          initialValue: values.patientData[customField.payloadDestinationPath]
            ? [values.patientData[customField.payloadDestinationPath].toLowerCase()]
            : [],
          controlType: {
            component: 'select',
            options: customField.items
              .sort((a, b) => a.order - b.order)
              .map(i => ({ value: i.value.toLowerCase(), label: formatMessage(messages[i.i18nKeyValue]) })),
          },
        },
      ]
    } else {
      row.items = [
        ...row.items,
        {
          id: customField.externalId || `patientData.${customField.payloadDestinationPath}`,
          controlType: { component: 'textField' },
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
        i18nKeyCaption: 'Genderi18nCaptionKey',
        payloadDestinationPath: 'gender',
        items: [
          { key: 1, value: 'Male', i18nKeyValue: 'male', order: 0 },
          { key: 0, value: 'Female', i18nKeyValue: 'female', order: 10 },
        ],
      }
      break
    case 'patientData.age':
      customField = {
        i18nKeyCaption: 'AgeFieldi18nKey',
        payloadDestinationPath: 'age',
      }
      break
    case 'patientData.retreatmentCase':
      customField = {
        i18nKeyCaption: 'RetreatCaseFieldi18nKey',
        payloadDestinationPath: 'retreatmentCase',
        items: [
          { key: 1, value: 'Yes', i18nKeyValue: 'yes', order: 0 },
          { key: 0, value: 'No', i18nKeyValue: 'no', order: 10 },
        ],
      }
      break
    case 'patientData.referringClinicianOrFacilityPhoneNumberIfKnown':
      customField = {
        i18nKeyCaption: 'Referringphonei18nKeyCaption',
        payloadDestinationPath: 'referringClinicianOrFacilityPhoneNumberIfKnown',
      }
      break
    case 'patientData.referringFacility':
      customField = {
        i18nKeyCaption: 'ReferringFacilityI18nkey',
        payloadDestinationPath: 'ReferringFacility',
      }
      break
    case 'patientData.repeatTest':
      customField = {
        i18nKeyCaption: 'RepeatTesti18nKey',
        payloadDestinationPath: 'repeatTest',
        items: [
          { key: 0, value: 'First or second', i18nKeyValue: 'firstOrSecond', order: 0 },
          { key: 1, value: 'Follow-up', i18nKeyValue: 'followUp', order: 10 },
          { key: 2, value: 'Repeat Baseline', i18nKeyValue: 'repeatBaseline', order: 20 },
        ],
      }
      break
    case 'patientData.patientName':
      customField = {
        i18nKeyCaption: 'PatientNameI18nCaptionKey',
        payloadDestinationPath: 'name',
      }
      break
    case 'patientData.address':
      customField = {
        i18nKeyCaption: 'AddressI18nCaptionKey',
        payloadDestinationPath: 'address',
      }
      break
    case 'patientData.mobileNumber':
      customField = {
        i18nKeyCaption: 'MobileNumberI18nkey',
        payloadDestinationPath: 'PatientPhone',
      }
      break
    case 'patientData.typeOfPatient':
      customField = {
        i18nKeyCaption: 'TypeOfPatientI18nKey',
        payloadDestinationPath: 'TypeOfPatient',
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
        i18nKeyCaption: 'PatientHistoryI18nKey',
        payloadDestinationPath: 'PatientHistory',
        items: [
          { key: 'unknown', value: 'Unknown history', i18nKeyValue: 'unknown', order: 0 },
          { key: 'new', value: 'New', i18nKeyValue: 'new', order: 10 },
          { key: 'treated', value: 'Previously treated', i18nKeyValue: 'treated', order: 20 },
        ],
      }
      break
    case 'patientData.patientRetreatment':
      customField = {
        i18nKeyCaption: 'PatientRetreatmentI18nKey',
        payloadDestinationPath: 'PatientRetreatment',
        items: [
          { key: 'Category-I', value: 'Category I', i18nKeyValue: 'Category-I', order: 0 },
          { key: 'Retreatment', value: 'Retreatment', i18nKeyValue: 'Retreatment', order: 10 },
        ],
      }
      break
    case 'patientData.hivStatus':
      customField = {
        i18nKeyCaption: 'HIVStatusI18nKey',
        payloadDestinationPath: 'HIVStatus',
        items: [
          { key: 'positive', value: 'Positive', i18nKeyValue: 'positive', order: 10 },
          { key: 'negative', value: 'Negative', i18nKeyValue: 'negative', order: 20 },
          { key: 'unknown', value: 'Unknown', i18nKeyValue: 'unknown', order: 99 },
        ],
      }
      break
    case 'patientData.sampleType':
      customField = {
        i18nKeyCaption: 'SampleTypeI18nKey',
        payloadDestinationPath: 'SampleType',
        items: [
          { key: 'pulmonary', value: 'Pulmonary', i18nKeyValue: 'pulmonary', order: 10 },
          { key: 'extra', value: 'Extra-pulmonary', i18nKeyValue: 'extra', order: 20 },
        ],
      }
      break
    case 'patientData.tbRegistrationNumberPrevious':
      customField = {
        i18nKeyCaption: 'TBRegistrationNumberPreviousI18nKey',
        payloadDestinationPath: 'tbRegistrationNumberPrevious',
      }
      break
    case 'patientData.tbRegistrationNumberCurrent':
      customField = {
        i18nKeyCaption: 'TBRegistrationNumberCurrentI18nKey',
        payloadDestinationPath: 'tbRegistrationNumberCurrent',
      }
      break

    default:
  }

  return customField
}

export default getFormConfigWithData
