import messages from '../messages'
import styles from '../NotificationFormPage.module.css'

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
              itemContainer: 'max_width_100pc tags_container',
              controlContainer: styles.full_width_100pc,
              item: styles.full_width_100pc,
            },
            labelI18nKey: 'daysOfInventoryLeft',
          },
        ],
      },
    ],
  }
}

const deviceOfflineSection = formatMessage => {
  return {
    id: 'whenDeviceHasBeenInactiveForMoreThan',
    label: 'whenDeviceHasBeenInactiveForMoreThan',
    labelI18nKey: 'whenDeviceHasBeenInactiveForMoreThan',
    visibleIf: values => ['DeviceOffline'].includes(values.notificationType),
    rows: [
      {
        id: 83,
        items: [
          {
            id: 'daysInactive',
            label: formatMessage(messages.daysInactive),
            initialValue: '1',
            controlType: { component: 'numberField', min: 1, max: 60 },
            classNames: {
              itemContainer: 'max_width_100pc tags_container',
              controlContainer: styles.full_width_100pc,
              item: styles.full_width_100pc,
            },
            labelI18nKey: 'daysInactive',
          },
        ],
      },
    ],
  }
}

const deviceOfflineRecurringSection = formatMessage => {
  return {
    id: 'repeatCheckAndNotifyInactive',
    label: 'repeatCheckAndNotifyInactive',
    labelI18nKey: 'repeatCheckAndNotifyInactive',
    visibleIf: values => ['DeviceOffline'].includes(values.notificationType),
    rows: [
      {
        id: 83,
        items: [
          {
            id: 'recurrenceFactor',
            label: formatMessage(messages.recurrenceFactor),
            initialValue: '0',
            controlType: {
              component: 'select',
              options: [
                { value: '0', label: '0' },
                { value: '1', label: '1' },
                { value: '2', label: '2' },
                { value: '3', label: '3' },
              ],
            },
            classNames: {
              itemContainer: 'max_width_100pc tags_container',
              controlContainer: styles.full_width_100pc,
              item: styles.full_width_100pc,
            },
            labelI18nKey: 'recurrenceFactor',
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
              itemContainer: 'max_width_100pc tags_container',
              controlContainer: styles.full_width_100pc,
              item: styles.full_width_100pc,
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
              itemContainer: 'max_width_100pc tags_container',
              controlContainer: styles.full_width_100pc,
              item: styles.full_width_100pc,
            },
            labelI18nKey: 'daysStockExpiring',
          },
        ],
      },
    ],
  }
}

const calibrationSection = formatMessage => {
  return {
    id: 'CalibrationDueDate',
    label: formatMessage(messages.calibrationDays),
    labelI18nKey: 'calibrationDays',
    visibleIf: values => ['CalibrationDueDate'].includes(values.notificationType),
    rows: [
      {
        id: 181,
        items: [
          {
            id: 'daysBeforeCalibrationDueDate',
            controlType: { component: 'numberField', min: 1, max: 90 },
            classNames: { itemContainer: styles.item_in_group_container },
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
  deviceOfflineRecurringSection,
}
