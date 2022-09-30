import messages from '../../NotificationListPage/messages'

const reportBasedSection = formatMessage => {
  return {
    id: 'section_reportBased',
    label: 'Issue Type',
    labelI18nKey: 'reportBaseType',
    visibleIf: values => {
      return ['reportBased'].includes(values.notificationType)
    },
    rows: [
      {
        id: 0,
        items: [
          {
            id: 'reportId',
            label: 'Reports',
            labelI18nKey: 'issues',
            controlType: {
              component: 'select',
              hideIfNoOptions: false,
              options: [
                {
                  label: formatMessage(messages.notificationCreateGroupForSite),
                  options: [
                    {
                      value: 'InventoryStockout',
                      label: formatMessage(messages.notificationTypeLowInventory),
                      icon: 'AiOutlineDashboard',
                    },
                    {
                      value: 'InventoryStockExpiring',
                      label: formatMessage(messages.notificationTypeExpiring),
                      icon: 'AiOutlineDashboard',
                    },
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
      {
        id: 2,
        items: [
          {
            id: 'hasRecurrency',
            label: 'Has recurrency',
            labelI18nKey: 'hasRecurrency',
            controlType: {
              component: 'checkbox',
            },
          },
          {
            id: 'recurrency',
            label: 'Recurrency',
            labelI18nKey: 'recurrency',
            controlType: {
              component: 'cron',
            },

            visibleIf: values => values.hasRecurrency === true,
          },
        ],
      },
    ],
  }
}

export { reportBasedSection }
