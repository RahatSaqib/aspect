import isNil from 'lodash/isNil'
import isPlainObject from 'lodash/isPlainObject'
import isString from 'lodash/isString'
import { REPORT_LIST } from '../../../../components/QueryFetch/Report'
import { cronMessages } from '../../../../messages/index'
import messages from '../../NotificationListPage/messages'

/**
 * helpers
 */
const DATE_RANGES = {
  PREVIOUS_CALENDAR_DAY: 'PREVIOUS_CALENDAR_DAY',
  PREVIOUS_WEEK_DAY: 'PREVIOUS_WEEK_DAY',
  PREVIOUS_WEEK: 'PREVIOUS_WEEK',
  PREVIOUS_7_DAYS: 'PREVIOUS_7_DAYS',
  PREVIOUS_MONTH: 'PREVIOUS_MONTH',
  PREVIOUS_QUARTER: 'PREVIOUS_QUARTER',
  PREVIOUS_YEAR: 'PREVIOUS_YEAR',
}
const optionsByFrequency = {
  daily: [
    {
      value: DATE_RANGES.PREVIOUS_CALENDAR_DAY,
      i18n: 'frequencyDailyPreviousCalendarDay',
      isVisible: values => {
        const { frequency, cronExpression } = values.cronRecurrency || {}
        return frequency === 'daily' && cronExpression[4] === '*'
      },
    },
    {
      value: DATE_RANGES.PREVIOUS_WEEK_DAY,
      i18n: 'frequencyDailyPreviousWeekDay',
      isVisible: values => {
        const { frequency, cronExpression } = values.cronRecurrency || {}
        return frequency === 'daily' && cronExpression[4] === '1-5'
      },
    },
  ],
  weekly: [
    {
      value: DATE_RANGES.PREVIOUS_7_DAYS,
      i18n: 'frequencyWeeklyPrevious7Days',
    },
    {
      value: DATE_RANGES.PREVIOUS_WEEK,
      i18n: 'frequencyWeeklyPreviousWeek',
      isVisible: values => {
        const { frequency, cronExpression } = values.cronRecurrency || {}
        return frequency === 'weekly' && cronExpression[4] !== '*' && cronExpression[4]?.split(',').length === 1
      },
    },
  ],
  monthly: [{ value: DATE_RANGES.PREVIOUS_MONTH, i18n: 'frequencyMonthlyPreviousMonth' }],
  quarterly: [{ value: DATE_RANGES.PREVIOUS_QUARTER, i18n: 'frequencyQuarterlyPreviousQuarter' }],
  yearly: [{ value: DATE_RANGES.PREVIOUS_YEAR, i18n: 'frequencyYearlyPreviousYear' }],
}
const getFrequency = values => {
  let cron = values.cronRecurrency
  if (!isPlainObject(cron) || isString(cron) || isNil(cron)) {
    cron = { frequency: 'daily' }
  }
  const { frequency } = cron
  return frequency
}

/**
 * form sections
 */
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
                  const frequency = getFrequency(values)
                  const byFrequency = optionsByFrequency[frequency]
                  let options = byFrequency || []
                  options = options.filter(it => (it.isVisible ? it.isVisible(values) : true))
                  return options
                },
              },
            },
          ],
        },
        {
          id: 402,
          items: [
            {
              id: 'reportStartingWeekDay',
              fullWidth: true,
              label: 'Starting Day of the Week',
              labelI18nKey: 'startingDayOfTheWeekTitle',
              controlType: {
                component: 'select',
                options: [
                  {
                    value: '0',
                    label: formatMessage(cronMessages.monday),
                  },
                  {
                    value: '1',
                    label: formatMessage(cronMessages.tuesday),
                  },
                  {
                    value: '2',
                    label: formatMessage(cronMessages.wednesday),
                  },
                  {
                    value: '3',
                    label: formatMessage(cronMessages.thursday),
                  },
                  {
                    value: '4',
                    label: formatMessage(cronMessages.friday),
                  },
                  {
                    value: '5',
                    label: formatMessage(cronMessages.saturday),
                  },
                  {
                    value: '6',
                    label: formatMessage(cronMessages.sunday),
                  },
                ],
              },
              visibleIf: values => {
                const frequency = getFrequency(values)
                return frequency === 'weekly' && values.reportDateRange === DATE_RANGES.PREVIOUS_WEEK
              },
            },
          ],
        },
      ],
    },
  ]
}

export { reportBasedSection }
