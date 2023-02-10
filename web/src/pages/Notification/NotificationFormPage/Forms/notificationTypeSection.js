import classnames from 'classnames/bind'
import messages from '../messages'
import styles from '../NotificationFormPage.css'

const cssClasses = classnames.bind(styles)

const notificationTypeSection = formatMessage => ({
  id: 'section_notificationType',
  label: 'Notification Type',
  labelI18nKey: 'notificationType',
  rows: [
    {
      id: 0,
      items: [
        {
          id: 'notificationType',
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
            placeholder: formatMessage(messages.notificationType),
          },
          classNames: {
            itemContainer: cssClasses('min-width-100pc', 'tags-container'),
            controlContainer: cssClasses('full-width-100pc'),
            item: cssClasses('full-width-100pc'),
          },
          labelI18nKey: 'notificationType',
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
          id: 'deviceOfflineDescription',
          visibleIf: values => values.notificationType === 'DeviceOffline',
          fullWidth: true,
          controlType: {
            component: 'messageField',
            icon: 'MdHelp',
            text: formatMessage(messages.notificationTypeDeviceOffline),
            color: 'cadetblue',
          },
        },
        {
          id: 'name',
          controlType: { component: 'textField' },
          fullWidth: true,
          labelI18nKey: 'notificationTitle',
        },
      ],
    },
  ],
})
export default notificationTypeSection
