import isEmpty from 'lodash/isEmpty'
import isNil from 'lodash/isNil'
import { REPORT_LIST } from '../../../../components/QueryFetch/Report'
import messages from '../../NotificationListPage/messages'

const reportBasedSection = formatMessage => {
  return {
    id: 'section_reportBased',
    label: 'Reports',
    labelI18nKey: 'reportBaseType',
    visibleIf: values => ['reportBased'].includes(values.notificationType),
    rows: [
      {
        id: 0,
        items: [
          {
            id: 'reportId',
            label: 'Reports',
            labelI18nKey: 'ReportsAvailable',
            controlType: {
              component: 'select',
              endpoint: `${REPORT_LIST.ENDPOINT}?availableForNotification=1`,
              hideIfNoOptions: false,
              queryKey: REPORT_LIST.KEY,
              normalizeLoadedData: response =>
                response.data.map(i => ({
                  label: formatMessage(messages[i.i18nKey]) || i.i18nKey,
                  value: i.externalId,
                })),
              isClearable: true,
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
            visibleIf: values => !isNil(values.reportId) && !isEmpty(values.reportId),
          },
        ],
      },
      {
        id: 3,
        items: [
          {
            id: 'recurrency',
            fullWidth: true,
            label: 'Recurrency',
            labelI18nKey: 'recurrency',
            controlType: {
              component: 'cron',
              onChange: value => {
                return value
              },
            },

            visibleIf: values => values.hasRecurrency === true && !isNil(values.reportId) && !isEmpty(values.reportId),
          },
        ],
      },
    ],
  }
}

export { reportBasedSection }
