import messages from '../messages'
import styles from '../NotificationFormPage.module.css'

const notificationTypeSection = (formatMessage, partner, isEdit) => ({
  id: 'section_notificationType',
  label: 'Notification Type',
  labelI18nKey: 'notificationType',
  rows: [
    {
      id: 0,
      items: [
        {
          id: 'notificationType',
          type: isEdit ? 'readOnly' : undefined,
          controlType: {
            component: 'select',
            hideIfNoOptions: false,
            options: [
              {
                label: formatMessage(messages.notificationCreateGroupForResults),
                options: [
                  {
                    value: 'resultBased',
                    label: formatMessage(messages.notificationTypeResultBased),
                    icon: 'AiOutlineSolution',
                  },
                ],
              },
              {
                label: formatMessage(messages.notificationCreateGroupForReport),
                options: [
                  {
                    value: 'reportBased',
                    label: formatMessage(messages.notificationTypeReportBased),
                    icon: 'AiOutlineContainer',
                  },
                ],
              },
              {
                label: formatMessage(messages.notificationCreateGroupForSite),
                options: [
                  {
                    value: 'InventoryStockout',
                    label: formatMessage(messages.notificationTypeLowInventory),
                    icon: 'AiOutlineDashboard',
                  },
                  {
                    value: 'SiteWithLowFieldCompletionRate',
                    label: formatMessage(messages.notificationTypeLowFieldCompletionRate),
                    icon: 'FaWpforms',
                  },
                  {
                    value: 'InventoryStockExpiring',
                    label: formatMessage(messages.notificationTypeExpiring),
                    icon: 'BsArrowDownRight',
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
                  {
                    value: 'CalibrationDueDate',
                    label: formatMessage(messages.notificationTypeCalibration),
                    icon: 'AiOutlineTool',
                  },
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
                    value: 'DeviceExpectedBackOnline',
                    label: formatMessage(messages.notificationTypeDeviceExpectedBackOnline),
                    icon: 'AiOutlineFieldTime',
                  },
                ],
              },
            ],
            placeholder: formatMessage(messages.notificationType),
          },
          labelI18nKey: 'notificationType',
        },
        {
          id: 'resultBasedScope',
          visibleIf: values => values.notificationType === 'resultBased',
          controlType: {
            component: 'select',
            options: [
              {
                value: 'created',
                label: formatMessage(messages.triggerWhenForResultCreated),
              },
              {
                value: 'any',
                label: formatMessage(messages.triggerWhenResultCreatedOrUpdated),
              },
            ],
          },
          labelI18nKey: 'triggerConditionTitle',
        },
        {
          id: 'siteWithLowFieldCompletionRateDescription',
          visibleIf: values => values.notificationType === 'SiteWithLowFieldCompletionRate',
          fullWidth: true,
          controlType: {
            component: 'messageField',
            icon: 'MdHelp',
            text: formatMessage(messages.notificationTypeLowFieldCompletionRateMessage),
            color: 'cadetblue',
          },
        },
        {
          id: 'descriptionWhenResultBasedNotificationBeTriggered',
          visibleIf: values => values.notificationType === 'resultBased',
          fullWidth: true,
          controlType: {
            component: 'messageField',
            icon: 'MdHelp',
            text: formatMessage(messages.notificationTypeResultBasedMessage, partner),
            color: 'cadetblue',
          },
        },
        {
          id: 'name',
          controlType: { component: 'textField' },
          fullWidth: true,
          labelI18nKey: 'notificationTitle',
          classNames: {
            itemContainer: styles.min_width_100pc,
          },
        },
      ],
    },
  ],
})
export default notificationTypeSection
