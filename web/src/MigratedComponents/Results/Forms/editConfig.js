import ASSAY_LIST from '../../QueryFetch/Assay'
import { DEVICE_TYPES } from '../../QueryFetch/Device'
import { SITE_ALL } from '../../QueryFetch/Site'
import { GEOGRAPHY_STATES } from '../../QueryFetch/Geography'

import messages from '../Detail/messages'

const getBaseOptions = response => {
  let options = []
  const { ok, data } = response
  if (ok) {
    options = data.map(({ id, name }) => ({
      label: name,
      value: id,
    }))
  }
  return options
}
const getResultCategoryOptions = (response, formik, formatMessage) => {
  let options = []
  const { ok, data } = response
  const { assayId } = formik.values
  if (ok) {
    const { resultCategories = [] } =
      data.find(({ id }) => id === assayId) || {}
    options = resultCategories.map(({ id, name, i18nKey }) => ({
      label: formatMessage(messages[i18nKey], name),
      value: id,
    }))
  }
  return options
}
const getConfig = formatMessage => {
  return {
    title: formatMessage(messages.resultTitle, 'Result Details'),
    icon: 'document',
    actions: {
      default: 'edit',
      // default: 'save',
      helpers: '',
      items: [
        /**
         * define custom buttons - their id's are used to set up
         * `isVisible` and `onClick` props
         */
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
        },
      ],
    },
    sections: [
      {
        id: 'Site',
        label: 'Site',
        labelI18nKey: 'site',
        rows: [
          {
            id: 10,
            items: [
              {
                // id: 'siteName',
                id: 'siteId',
                controlType: {
                  component: 'select',
                  endpoint: SITE_ALL.ENDPOINT,
                  hideIfNoOptions: false,
                  queryKey: SITE_ALL.KEY,
                  normalizeLoadedData: response => getBaseOptions(response),
                },
                label: 'Site Name',
                labelI18nKey: 'siteName',
                link: {
                  key: 'siteId',
                  url: '/browse/site/:siteId',
                },
              },
              {
                id: 'lgaName',
                controlType: {
                  component: 'textField',
                },
                label: 'City',
                labelI18nKey: 'city',
              },
              {
                id: 'stateId',
                controlType: {
                  component: 'select',
                  endpoint: GEOGRAPHY_STATES.ENDPOINT,
                  hideIfNoOptions: false,
                  queryKey: GEOGRAPHY_STATES.KEY,
                  normalizeLoadedData: response => getBaseOptions(response),
                },
                labelI18nKey: 'state',
              },
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
              {
                id: 'deviceName',
                controlType: {
                  component: 'textField',
                },
                label: 'Device Name',
                labelI18nKey: 'deviceName',
                link: {
                  key: 'deviceId',
                  url: '/browse/device/:deviceId',
                },
              },
              {
                id: 'deviceTypeId',
                controlType: {
                  component: 'select',
                  endpoint: DEVICE_TYPES.ENDPOINT,
                  hideIfNoOptions: false,
                  queryKey: DEVICE_TYPES.KEY,
                  normalizeLoadedData: response => {
                    let options = []
                    const { ok, data } = response
                    if (ok) {
                      options = data
                        .filter(
                          ({ name }) =>
                            !name.includes('Aspect') &&
                            !name.includes('GxAlert')
                        )
                        .map(({ id, name }) => ({
                          label: name,
                          value: id,
                        }))
                    }
                    return options
                  },
                },
                labelI18nKey: 'deviceType',
              },
              {
                id: 'deviceSerial',
                controlType: {
                  component: 'textField',
                },
                label: 'Device Serial',
                labelI18nKey: 'deviceSerial',
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
              {
                id: 'assayId',
                controlType: {
                  component: 'select',
                  endpoint: ASSAY_LIST.ENDPOINT,
                  hideIfNoOptions: false,
                  queryKey: ASSAY_LIST.KEY,
                  normalizeLoadedData: (response, formik) => {
                    let options = []
                    const { ok, data } = response
                    const { deviceTypeId } = formik.values
                    if (ok) {
                      options = data
                        .filter(item => item.deviceTypeId === deviceTypeId)
                        .map(({ id, name }) => ({
                          label: name,
                          value: id,
                        }))
                    }
                    return options
                  },
                  dependencies: ['deviceTypeId'],
                },
                label: 'Assay',
                labelI18nKey: 'assay',
              },
            ],
          },
        ],
      },
      {
        id: 'Result',
        label: 'Result',
        labelI18nKey: 'result',
        rows: [
          {
            id: 40,
            items: [
              {
                id: 'resultCategory1',
                controlType: {
                  component: 'select',
                  endpoint: ASSAY_LIST.ENDPOINT,
                  hideIfNoOptions: false,
                  queryKey: ASSAY_LIST.KEY,
                  normalizeLoadedData: (response, formik) =>
                    getResultCategoryOptions(response, formik, formatMessage),
                  dependencies: ['assayId'],
                },
                label: 'resultCategory1Label',
              },
              {
                id: 'resultCategory2',
                controlType: {
                  component: 'select',
                  endpoint: ASSAY_LIST.ENDPOINT,
                  hideIfNoOptions: false,
                  queryKey: ASSAY_LIST.KEY,
                  normalizeLoadedData: (response, formik) =>
                    getResultCategoryOptions(response, formik, formatMessage),
                  dependencies: ['assayId'],
                },
                label: 'resultCategory2Label',
                hideIfNull: true,
              },
              {
                id: 'detectedResistance',
                controlType: {
                  component: 'textField',
                },
                label: 'Detected Resistance',
                hideIfNull: true,
              },
              {
                id: 'fullResultText',
                controlType: {
                  component: 'textArea',
                },
                label: 'Result Text',
                labelI18nKey: 'resultText',
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
                  component: 'datePicker',
                  format: 'dd MMM yyyy hh:mm',
                },
                type: 'string',
                label: 'Start Date',
                labelI18nKey: 'startDate',
              },
              {
                id: 'endedOn',
                controlType: {
                  component: 'datePicker',
                },
                type: 'string',
                label: 'End Date',
                labelI18nKey: 'endDate',
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
                id: 'sampleTypeName',
                controlType: {
                  component: 'textField',
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
                id: 'reportableSiteId',
                controlType: {
                  component: 'select',
                  endpoint: SITE_ALL.ENDPOINT,
                  hideIfNoOptions: false,
                  queryKey: SITE_ALL.KEY,
                  normalizeLoadedData: response => getBaseOptions(response),
                },
                label: 'Reportable Site',
                labelI18nKey: 'reportableSite',
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
                id: 'externalId',
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
                  component: 'datePicker',
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
