import { SITE_ALL } from '../../QueryFetch/Site'
import SAMPLE_TYPES from '../../QueryFetch/SampleType'
import {
  getBaseOptions,
  siteProps,
  stateProps,
  lgaProps,
  deviceProps,
  assayProps,
  resultCategoryControlType,
} from './utils'

import messages from '../Detail/messages'

const getConfig = (formatMessage, isNew, { resultCategory1i18nKey, resultCategory2i18nKey } = {}) => {
  return {
    title: formatMessage(messages.resultTitle, 'Result Details'),
    icon: 'document',
    actions: {
      default: isNew ? 'save' : 'edit',
      helpers: '',
      items: [
        /**
         * define custom buttons - their id's are used to set up
         * `isVisible` and `onClick` props
         */
        {
          id: 'back',
          text: formatMessage(messages.button_Back, 'Back to List'),
          action: 'backToList',
          ui: {
            variant: 'outlined',
          },
          isVisible: (permissions, isEditMode) => !isNew && !isEditMode,
          returnUrl: `/browse/result`,
        },
        {
          id: 'transfer',
          text: formatMessage(messages.transferResult),
        },
        /**
         * define generic buttons
         */
        {
          id: 'edit',
          text: formatMessage(messages.button_Edit, 'Edit'),
          action: 'enableEdit',
        },
        {
          id: 'save',
          text: formatMessage(messages.button_Submit, 'Submit'),
          action: 'saveResult',
        },
        {
          id: 'cancel',
          text: formatMessage(messages.button_Cancel, 'Cancel'),
          action: 'cancelEdit',
          ui: {
            variant: 'outlined',
          },
          returnUrl: isNew ? `/browse/result` : null,
        },
      ],
    },
    sections: [
      /**
       * non-editable fields in Update mode
       */
      {
        id: 'Site',
        label: 'Site',
        labelI18nKey: 'site',
        rows: [
          {
            id: 10,
            items: [
              ...stateProps(isNew, {
                label: 'State',
                labelI18nKey: 'state',
              }),
              ...lgaProps(isNew, {
                label: 'LGA',
                labelI18nKey: 'lga',
              }),
              ...siteProps(isNew, {
                label: 'Site Name',
                labelI18nKey: 'siteName',
                link: {
                  key: 'siteId',
                  url: '/browse/site/:siteId',
                },
              }),
            ],
          },
        ],
      },
      {
        id: 'Device',
        label: 'Device',
        labelI18nKey: 'device',
        rows: [
          {
            id: 20,
            items: [
              ...deviceProps(isNew, {
                label: 'Device Name',
                labelI18nKey: 'deviceName',
                link: {
                  key: 'deviceId',
                  url: '/browse/device/:deviceId',
                },
              }),
              {
                id: 'deviceType',
                controlType: {
                  component: 'textField',
                },
                labelI18nKey: 'deviceType',
                type: 'readOnly',
                visibleIf: values => !!values.deviceId,
              },
              {
                id: 'deviceTypeId',
                controlType: {
                  component: 'hidden',
                },
                type: 'readOnly',
              },
            ],
          },
        ],
      },
      {
        id: 'Assay',
        label: 'Assay',
        labelI18nKey: 'assay',
        rows: [
          {
            id: 30,
            items: [
              ...assayProps(isNew, {
                label: 'Assay',
                labelI18nKey: 'assay',
              }),
            ],
          },
        ],
      },
      /**
       * editable fields in both Create and Update
       */
      {
        id: 'Result',
        label: 'Result',
        labelI18nKey: 'result',
        rows: [
          {
            id: 40,
            items: [
              {
                /**
                 * when this hidden value is not 'EnteredByHand' then it disables
                 * `resultCategory1`, `resultCategory2` and `endedOn`.
                 * For reference - see func updateResult in `api/src/result/service.js`
                 */
                id: 'resultSourceExternalId',
                controlType: {
                  component: 'hidden',
                },
                type: 'readOnly',
              },
              {
                id: 'resultCategory1',
                controlType: {
                  ...resultCategoryControlType(formatMessage),
                },
                labelI18nKey: resultCategory1i18nKey || 'resultCategory1',
                label: 'resultCategory1Label',
                disabledIf: values =>
                  !!values.resultSourceExternalId && values.resultSourceExternalId !== 'EnteredByHand',
              },
              {
                id: 'resultCategory2',
                controlType: {
                  ...resultCategoryControlType(formatMessage),
                  isClearable: true,
                },
                labelI18nKey: resultCategory2i18nKey || 'resultCategory2',
                label: 'resultCategory2Label',
                hideIfNull: true,
                disabledIf: values =>
                  !!values.resultSourceExternalId && values.resultSourceExternalId !== 'EnteredByHand',
              },
              {
                id: 'detectedResistance',
                controlType: {
                  component: 'textField',
                },
                label: 'Detected Resistance',
                hideIfNull: true,
                visibleIf: (values, isEditMode) => !isNew && !isEditMode,
              },
              {
                id: 'fullResultText',
                controlType: {
                  component: 'textArea',
                },
                label: 'Result Text',
                labelI18nKey: 'resultText',
                visibleIf: (values, isEditMode) => !isEditMode,
              },
            ],
          },
          {
            id: 41,
            items: [
              {
                id: 'errorCode',
                controlType: {
                  component: 'textField',
                },
                label: 'Error Code',
                labelI18nKey: 'errorCode',
              },
              {
                id: 'notes',
                controlType: {
                  component: 'textArea',
                  rowsMax: 5,
                  rows: 3,
                },
                label: 'Notes',
                labelI18nKey: 'notes',
              },
            ],
          },
        ],
      },
      {
        id: 'Date',
        label: 'Date',
        labelI18nKey: 'date',
        rows: [
          {
            id: 50,
            items: [
              {
                id: 'startedOn',
                controlType: {
                  component: 'dateTimePicker',
                  format: 'dd MMM yyyy hh:mm',
                  timeIntervals: 1,
                  isClearable: true,
                },
                type: 'string',
                label: 'Start Date',
                labelI18nKey: 'startDate',
              },
              {
                id: 'endedOn',
                controlType: {
                  component: 'dateTimePicker',
                  format: 'dd MMM yyyy hh:mm',
                  timeIntervals: 1,
                  isClearable: true,
                },
                type: 'string',
                label: 'End Date',
                labelI18nKey: 'endDate',
                disabledIf: values =>
                  !!values.resultSourceExternalId && values.resultSourceExternalId !== 'EnteredByHand',
              },
            ],
          },
        ],
      },
      {
        id: 'Sample',
        label: 'Sample',
        labelI18nKey: 'sample',
        rows: [
          {
            id: 60,
            items: [
              {
                id: 'sampleId',
                controlType: {
                  component: 'textField',
                },
                label: 'Sample ID',
                labelI18nKey: 'sampleId',
              },
              {
                id: 'sampleTypeId',
                controlType: {
                  component: 'select',
                  endpoint: SAMPLE_TYPES.ENDPOINT,
                  hideIfNoOptions: false,
                  queryKey: SAMPLE_TYPES.KEY,
                  normalizeLoadedData: response =>
                    getBaseOptions(response, {
                      formatMessage,
                      propNameForI18n: 'i18nKey',
                    }),
                  isClearable: true,
                },
                label: 'Sample Type',
                labelI18nKey: 'sampleType',
              },
              {
                id: 'sampleCollectedOn',
                controlType: {
                  component: 'datePicker',
                  format: 'dd MMM yyyy hh:mm',
                },
                label: 'Collected On',
                labelI18nKey: 'collectedOn',
              },
            ],
          },
          {
            id: 61,
            items: [
              {
                id: 'sampleOriginSiteId',
                controlType: {
                  component: 'select',
                  endpoint: SITE_ALL.ENDPOINT,
                  hideIfNoOptions: false,
                  queryKey: SITE_ALL.KEY,
                  normalizeLoadedData: response => getBaseOptions(response),
                  isClearable: true,
                },
                label: 'Sample Collection Site',
                labelI18nKey: 'sampleCollectionSite',
              },
              {
                id: 'senderOperator',
                controlType: {
                  component: 'textField',
                },
                label: 'Collected By',
                labelI18nKey: 'collectedBy',
              },
              {
                id: 'reportableSiteName',
                controlType: {
                  component: 'textField',
                },
                label: 'Reportable Site',
                labelI18nKey: 'reportableSite',
                type: 'readOnly',
              },
              {
                id: 'reportableSiteId',
                controlType: {
                  component: 'hidden',
                },
              },
            ],
          },
        ],
      },
      {
        id: 'Patient',
        label: 'Patient',
        labelI18nKey: 'patient',
        rows: [
          {
            id: 70,
            items: [
              {
                id: 'patientId',
                controlType: {
                  component: 'textField',
                },
                label: 'Patient ID',
                labelI18nKey: 'patientId',
              },
              {
                id: 'caseExternalId',
                controlType: {
                  component: 'textField',
                },
                label: 'Case ID',
                labelI18nKey: 'caseId',
              },
            ],
          },
        ],
      },
      {
        id: 'TechicalDetails',
        label: 'Technical Details',
        labelI18nKey: 'technicalDetails',
        visibleIf: (values, isEditMode) => !isEditMode,
        rows: [
          {
            id: 80,
            items: [
              {
                id: 'instrumentSerial',
                controlType: {
                  component: 'textField',
                },
                label: 'Instrument Serial',
                labelI18nKey: 'instrumentSerial',
              },
              {
                id: 'moduleName',
                controlType: {
                  component: 'textField',
                },
                label: 'Module Name',
                labelI18nKey: 'moduleName',
              },
              {
                id: 'moduleSerial',
                controlType: {
                  component: 'textField',
                },
                label: 'Module Serial',
                labelI18nKey: 'moduleSerial',
              },
            ],
          },
          {
            id: 81,
            items: [
              {
                id: 'consumableExpirationDate',
                controlType: {
                  component: 'datePickerNoTimezone',
                },
                label: 'Consumable Expiration Date',
                labelI18nKey: 'consumableExpirationDate',
              },
              {
                id: 'consumableLot',
                controlType: {
                  component: 'textField',
                },
                label: 'Consumable Lot',
                labelI18nKey: 'consumableLot',
              },
              {
                id: 'consumableSerial',
                controlType: {
                  component: 'textField',
                },
                label: 'Consumable Serial',
                labelI18nKey: 'consumableSerial',
              },
            ],
          },
          {
            id: 82,
            items: [
              {
                /**
                 * TODO: replace `senderOperator2` to another value of formik
                 * field name to save change - see API endpoint for POST/PUT
                 * of result form
                 */
                id: 'senderOperator2',
                controlType: {
                  component: 'textField',
                },
                label: 'Sender Operator',
                labelI18nKey: 'senderOperator',
              },
            ],
          },
        ],
      },
    ],
  }
}

export default getConfig
