import messages from '../Detail/messages'

const getConfig = formatMessage => {
  console.log(formatMessage(messages.transferResult))

  return {
    title: formatMessage(messages.resultTitle, 'Result Details'),
    icon: 'document',
    actions: {
      default: 'edit',
      helpers: '',
      items: [
        {
          id: 'transfer',
          text: formatMessage(messages.transferResult),
          action: 'transferResult',
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
            id: 0,
            items: [
              {
                id: 'siteName',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
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
                type: 'readOnly',
                label: 'City',
                labelI18nKey: 'city',
              },
              {
                id: 'stateName',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
                label: 'State',
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
            id: 0,
            items: [
              {
                id: 'deviceName',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
                label: 'Device Name',
                labelI18nKey: 'deviceName',
                link: {
                  key: 'deviceId',
                  url: '/browse/device/:deviceId',
                },
              },
              {
                id: 'deviceType',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
                label: 'Device Type',
                labelI18nKey: 'deviceType',
              },
              {
                id: 'deviceSerial',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
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
            id: 0,
            items: [
              {
                id: 'assayName',
                controlType: {
                  component: 'textField',
                },
                label: 'Assay',
                labelI18nKey: 'assay',
                type: 'readOnly',
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
            id: 0,
            items: [
              {
                id: 'resultCategory1Name',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
                label: 'resultCategory1Label',
              },
              {
                id: 'resultCategory2Name',
                controlType: {
                  component: 'textField',
                },
                label: 'resultCategory2Label',
                type: 'readOnly',
                hideIfNull: true,
              },
              {
                id: 'resultText',
                controlType: {
                  component: 'textField',
                },
                label: 'Result Text',
                labelI18nKey: 'resultText',
                type: 'readOnly',
              },
            ],
          },
          {
            id: 1,
            items: [
              {
                id: 'errorCode',
                controlType: {
                  component: 'textField',
                },
                type: 'string',
                label: 'Error Code',
                labelI18nKey: 'errorCode',
              },
              {
                id: 'notes',
                controlType: {
                  component: 'textField',
                },
                type: 'string',
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
            id: 0,
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
            id: 0,
            items: [
              {
                id: 'sampleId',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
                label: 'Sample ID',
                labelI18nKey: 'sampleId',
              },
              {
                id: 'sampleTypeName',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
                label: 'Sample Type',
                labelI18nKey: 'sampleType',
              },
              {
                id: 'sampleCollectedOn',
                controlType: {
                  component: 'datePicker',
                  format: 'dd MMM yyyy hh:mm',
                },
                type: 'readOnly',
                label: 'Collected On',
                labelI18nKey: 'collectedOn',
              },
            ],
          },
          {
            id: 1,
            items: [
              {
                id: 'sampleOriginSiteName',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
                label: 'Sample Collection Site',
                labelI18nKey: 'sampleCollectionSite',
              },
              {
                id: 'senderOperator',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
                label: 'Collected By',
                labelI18nKey: 'collectedBy',
              },
              {
                id: 'reportableSiteName',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
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
            id: 0,
            items: [
              {
                id: 'patientId',
                controlType: {
                  component: 'textField',
                },
                type: 'string',
                label: 'Patient ID',
                labelI18nKey: 'patientId',
              },
              {
                id: 'externalId',
                controlType: {
                  component: 'textField',
                },
                type: 'string',
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
            id: 0,
            items: [
              {
                id: 'instrumentSerial',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
                label: 'Instrument Serial',
                labelI18nKey: 'instrumentSerial',
              },
              {
                id: 'moduleName',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
                label: 'Module Name',
                labelI18nKey: 'moduleName',
              },
              {
                id: 'moduleSerial',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
                label: 'Module Serial',
                labelI18nKey: 'moduleSerial',
              },
            ],
          },
          {
            id: 1,
            items: [
              {
                id: 'consumableExpirationDate',
                controlType: {
                  component: 'datePicker',
                },
                type: 'readOnly',
                label: 'Consumable Expiration Date',
                labelI18nKey: 'consumableExpirationDate',
              },
              {
                id: 'consumableLot',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
                label: 'Consumable Lot',
                labelI18nKey: 'consumableLot',
              },
              {
                id: 'consumableSerial',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
                label: 'Consumable Serial',
                labelI18nKey: 'consumableSerial',
              },
            ],
          },
          {
            id: 2,
            items: [
              {
                id: 'senderOperator',
                controlType: {
                  component: 'textField',
                },
                type: 'readOnly',
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
