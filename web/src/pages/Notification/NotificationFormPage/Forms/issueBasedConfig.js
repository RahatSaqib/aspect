import classnames from 'classnames/bind'
import messages from '../messages'
import styles from '../NotificationFormPage.css'

const cssClasses = classnames.bind(styles)

const lowInventorySection = (formatMessage, partner) => {
  return {
    id: 'whenDeviceHasLessThan',
    label: 'whenDeviceHasLessThan',
    labelI18nKey: 'whenDeviceHasLessThan',
    visibleIf: values => ['InventoryStockout'].includes(values.notificationType),
    rows: [
      {
        id: 85,
        items: [
          {
            id: 'daysOfInventoryLeft',
            label: formatMessage(messages.daysOfInventoryLeft),
            initialValue: [`${partner.dueDaysInventoryStockout}`],
            type: 'readOnly',
            controlType: {
              component: 'select',
              hideIfNoOptions: false,
              options: [{ value: `${partner.dueDaysInventoryStockout}`, label: `${partner.dueDaysInventoryStockout}` }],
            },
            classNames: {
              itemContainer: cssClasses('max-width-100pc', 'tags-container'),
              controlContainer: cssClasses('full-width-100pc'),
              item: cssClasses('full-width-100pc'),
            },
            labelI18nKey: 'daysOfInventoryLeft',
          },
        ],
      },
    ],
  }
}

const deviceOfflineSection = (formatMessage, partner) => {
  return {
    id: 'whenDeviceHasBeenOfflineForMoreThan',
    label: 'whenDeviceHasBeenOfflineForMoreThan',
    labelI18nKey: 'whenDeviceHasBeenOfflineForMoreThan',
    visibleIf: values => ['DeviceOffline'].includes(values.notificationType),
    rows: [
      {
        id: 83,
        items: [
          {
            id: 'daysOffline',
            label: formatMessage(messages.daysOffline),
            initialValue: [`${partner.maxDaysDeviceOffline}`],
            type: 'readOnly',
            controlType: {
              component: 'select',
              hideIfNoOptions: false,
              options: [{ value: `${partner.maxDaysDeviceOffline}`, label: `${partner.maxDaysDeviceOffline}` }],
            },
            classNames: {
              itemContainer: cssClasses('max-width-100pc', 'tags-container'),
              controlContainer: cssClasses('full-width-100pc'),
              item: cssClasses('full-width-100pc'),
            },
            labelI18nKey: 'daysOffline',
          },
        ],
      },
    ],
  }
}

const deviceNoResultsSection = (formatMessage, partner) => {
  return {
    id: 'whenDeviceDidNotSendResultsForMoreThan',
    label: 'whenDeviceDidNotSendResultsForMoreThan',
    labelI18nKey: 'whenDeviceDidNotSendResultsForMoreThan',
    visibleIf: values => ['DeviceNoResults'].includes(values.notificationType),
    rows: [
      {
        id: 85,
        items: [
          {
            id: 'daysNoResults',
            label: formatMessage(messages.daysWithoutResults),
            initialValue: [`${partner.maxDaysDeviceNoResults}`],
            type: 'readOnly',
            controlType: {
              component: 'select',
              hideIfNoOptions: false,
              options: [{ value: `${partner.maxDaysDeviceNoResults}`, label: `${partner.maxDaysDeviceNoResults}` }],
            },
            classNames: {
              itemContainer: cssClasses('max-width-100pc', 'tags-container'),
              controlContainer: cssClasses('full-width-100pc'),
              item: cssClasses('full-width-100pc'),
            },
            labelI18nKey: 'daysWithoutResults',
          },
        ],
      },
    ],
  }
}

const stockExpiringSection = (formatMessage, partner) => {
  return {
    id: 'stockExpiring',
    label: 'stockExpiring',
    labelI18nKey: 'stockExpiring',
    visibleIf: values => {
      return ['InventoryStockExpiring'].includes(values.notificationType)
    },
    rows: [
      {
        id: 81,
        items: [
          {
            id: 'stockExpiring',
            label: formatMessage(messages.stockExpiring),
            initialValue: [`${partner.dueDaysInventoryStockExpiring}`],
            type: 'readOnly',
            controlType: {
              component: 'select',
              hideIfNoOptions: false,
              options: [
                {
                  value: `${partner.dueDaysInventoryStockExpiring}`,
                  label: `${partner.dueDaysInventoryStockExpiring}`,
                },
              ],
            },
            classNames: {
              itemContainer: cssClasses('max-width-100pc', 'tags-container'),
              controlContainer: cssClasses('full-width-100pc'),
              item: cssClasses('full-width-100pc'),
            },
            labelI18nKey: 'daysStockExpiring',
          },
        ],
      },
    ],
  }
}

const calibrationSection = () => {
  return {
    id: 'CalibrationDueDate',
    label: 'calibrationDays',
    labelI18nKey: 'calibrationDays',
    visibleIf: values => ['CalibrationDueDate'].includes(values.notificationType),
    rows: [
      {
        id: 181,
        items: [
          {
            id: 'daysBeforeCalibrationDueDate',
            controlType: { component: 'numberField', min: 1, max: 90 },
            classNames: { itemContainer: cssClasses('item-in-group-container') },
            type: 'text',
            labelI18nKey: 'daysBeforeCalibrationDueDate',
          },
        ],
      },
    ],
  }
}

const issueBasedSection = formatMessage => {
  return {
    id: 'section_issueType',
    label: 'Issue Type',
    labelI18nKey: 'issueType',
    visibleIf: values => ['issueBased'].includes(values.notificationType),
    rows: [
      {
        id: 0,
        items: [
          {
            id: 'issueTypeId',
            label: 'issues',
            labelI18nKey: 'issues',
            controlType: {
              component: 'select',
              hideIfNoOptions: false,
              options: [
                {
                  label: formatMessage(messages.notificationCreateGroupForSite),
                  options: [
                    // {
                    //   value: 'InventoryStockout',
                    //   label: formatMessage(messages.notificationTypeLowInventory),
                    //   icon: 'AiOutlineDashboard',
                    // },
                    // {
                    //   value: 'InventoryStockExpiring',
                    //   label: formatMessage(messages.notificationTypeExpiring),
                    //   icon: 'AiOutlineDashboard',
                    // },
                  ],
                },
                {
                  label: formatMessage(messages.notificationCreateGroupForDevices),
                  options: [
                    {
                      value: 'DeviceNoResults',
                      label: formatMessage(messages.notificationTypeNoResult),
                      icon: 'AiOutlineFileExclamation',
                    },
                    {
                      value: 'DeviceOffline',
                      label: formatMessage(messages.notificationTypeOffline),
                      icon: 'AiOutlineApi',
                    },
                    // { TODO:  Uncomment when the issue is ready.
                    //   value: 'calibration',
                    //   label: formatMessage(messages.notificationTypeCalibration),
                    //   icon: 'AiOutlineTool',
                    // },
                    {
                      value: 'ModuleReplaced',
                      label: formatMessage(messages.notificationTypeModuleReplaced),
                      icon: 'AiOutlineSwap',
                    },
                    {
                      value: 'ModuleDisabled',
                      label: formatMessage(messages.notificationTypeModuleDisabled),
                      icon: 'AiOutlineBlock',
                    },
                    {
                      value: 'UnusedModules',
                      label: formatMessage(messages.notificationTypeModuleUnused),
                      icon: 'AiOutlineExclamation',
                    },
                    {
                      value: 'InstrumentReplaced',
                      label: formatMessage(messages.notificationTypeInstrumentReplaced),
                      icon: 'AiOutlineTool',
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
  }
}

export {
  issueBasedSection,
  lowInventorySection,
  deviceNoResultsSection,
  deviceOfflineSection,
  stockExpiringSection,
  calibrationSection,
}
