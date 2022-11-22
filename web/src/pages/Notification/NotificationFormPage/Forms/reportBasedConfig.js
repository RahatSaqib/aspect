import isNil from 'lodash/isNil'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import { REPORT_LIST } from '../../../../components/QueryFetch/Report'
import messages from '../../NotificationListPage/messages'

const DATE_RANGES = {
  PREVIOUS_CALENDAR_DAY: 'PREVIOUS_CALENDAR_DAY',
  PREVIOUS_WORKING_DAY: 'PREVIOUS_WORKING_DAY',
  PREVIOUS_WEEK: 'PREVIOUS_WEEK',
  PREVIOUS_MONTH: 'PREVIOUS_MONTH',
  PREVIOUS_QUARTER: 'PREVIOUS_QUARTER',
  PREVIOUS_YEAR: 'PREVIOUS_YEAR',
}
const optionsByFrequency = {
  daily: [
    { value: DATE_RANGES.PREVIOUS_CALENDAR_DAY, i18n: 'frequencyDailyPreviousCalendarDay' },
    { value: DATE_RANGES.PREVIOUS_WORKING_DAY, i18n: 'frequencyDailyPreviousWorkingDay' },
  ],
  weekly: [{ value: DATE_RANGES.PREVIOUS_WEEK, i18n: 'frequencyWeeklyPreviousWeek' }],
  monthly: [{ value: DATE_RANGES.PREVIOUS_MONTH, i18n: 'frequencyMonthlyPreviousMonth' }],
  quarterly: [{ value: DATE_RANGES.PREVIOUS_QUARTER, i18n: 'frequencyQuarterlyPreviousQuarter' }],
  yearly: [{ value: DATE_RANGES.PREVIOUS_YEAR, i18n: 'frequencyYearlyPreviousYear' }],
}

const reportBasedSection = formatMessage => {
  return [
    {
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
          id: 3,
          items: [
            {
              id: 'cronRecurrency',
              fullWidth: true,
              label: 'Recurrency',
              labelI18nKey: 'recurrency',
              controlType: {
                component: 'cron',
              },
            },
          ],
        },
      ],
    },

    {
      id: 'section_reportBased_dataDateRange',
      label: 'Data Date Range',
      labelI18nKey: 'dataDateRange',
      visibleIf: values => ['reportBased'].includes(values.notificationType),
      rows: [
        {
          id: 401,
          items: [
            {
              id: 'reportDateRange',
              fullWidth: true,
              label: 'Define Date Range',
              labelI18nKey: 'dataDateRangeTitle',
              controlType: {
                component: 'radioButtonList',
                getOptions: values => {
                  let cron = values.cronRecurrency
                  if (!isPlainObject(cron) || isString(cron) || isNil(cron)) {
                    cron = { frequency: 'daily' }
                  }
                  const { frequency } = cron
                  const byFrequency = optionsByFrequency[frequency]
                  const options = byFrequency || []
                  return options
                },
              },
            },
          ],
        },
      ],
    },
  ]
}

export { reportBasedSection }
