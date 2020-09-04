import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { defineMessage, useIntl } from 'react-intl'
import Card from '@material-ui/core/Card'

import AspectLink from '../../components/shared/AspectLink'
import AspectTooltip from '../../components/shared/AspectTooltip'
import IconProvider from '../IconProvider'
import { buildMessagesFromI18nKeys } from './Helpers'
import {
  getTimePeriod,
  getAllDaysInCurrentMonth,
} from '../Graphs/Helpers/Formatters/datetime'

const cssClasses = classnames.bind(require('./Widgets.css'))

const buildDateRange = term => {
  let dateRange
  switch (true) {
    case term === 'last30Days':
      dateRange = {
        minDate: getTimePeriod(30, 'days', 'yyyy-MM-dd'),
        maxDate: getTimePeriod(0, 'days', 'yyyy-MM-dd'),
      }
      break

    case term === 'currentMonth':
      dateRange = {
        minDate: getAllDaysInCurrentMonth().start,
        maxDate: getAllDaysInCurrentMonth(true).end,
      }
      break

    default:
      dateRange = {}
      break
  }
  return dateRange
}

const buildWidgetToLinkParams = (link, linkParams) => {
  const inParams = JSON.parse(linkParams)
  if (
    inParams &&
    Object.keys(inParams).length !== 0 &&
    inParams.constructor === Object
  ) {
    let tempParams = {}
    for (const [key, value] of Object.entries(inParams)) {
      switch (true) {
        case key === 'dateRange':
          tempParams = { ...tempParams, ...buildDateRange(value) }
          break

        default:
          tempParams[key] = value
          break
      }
    }
    return `${link}?filters=${encodeURIComponent(
      new URLSearchParams(tempParams).toString()
    )}`
  }
  return link
}

const AspectWidget = ({
  data,
  data: {
    link,
    linkParams,
    icon,
    description,
    count,
    extra,
    title,
    unit,
    subTitle,
    statStatus,
    extraLabel,
    statUnitI18nKey,
  },
}) => {
  const { formatMessage: intlFormatMessage } = useIntl()
  const messages = defineMessage(buildMessagesFromI18nKeys(data))
  const linkParam = buildWidgetToLinkParams(link, linkParams)

  return (
    <AspectLink
      to={linkParam}
      className={cssClasses('Summary', {
        'Summary_Link--disabled': !link,
      })}
      testId="SummaryStatus--Summary_Link"
    >
      <Card className={cssClasses('Summary__Card')}>
        <div className={cssClasses('Summary__Card__Title')}>
          <IconProvider icon={icon} className="summaryCard__icon" />
          <span className={cssClasses('Summary__Card__Title--main')}>
            {title}
            <span className={cssClasses('Summary__Card__Title--sub')}>
              {subTitle}
            </span>
          </span>
          {description ? (
            <AspectTooltip showHelpIcon title={description} />
          ) : null}
        </div>
        <div className={cssClasses('Summary__Card__Content')}>
          <div className={cssClasses('Summary__Card__Item')}>
            <div className={cssClasses('Summary__Card__Item__Count')}>
              {count}
            </div>
            <div className={cssClasses('Summary__Card__Item__Messages')}>
              <div
                className={cssClasses('Summary__Card__Item__Messages--main')}
              >
                {statUnitI18nKey !== null &&
                  intlFormatMessage(messages.statUnitI18nKey, { unit })}
              </div>
              <div className={cssClasses('Summary__Card__Item__Messages--sub')}>
                {statStatus}
              </div>
            </div>
          </div>
          <div className={cssClasses('Summary__Card__Item--right')}>
            <div className={cssClasses('Summary__Card__Item__Messages')}>
              <div
                className={cssClasses('Summary__Card__Item__Messages--main')}
              >
                {extra}
              </div>
              <div className={cssClasses('Summary__Card__Item__Messages--sub')}>
                {extraLabel}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </AspectLink>
  )
}

AspectWidget.propTypes = {
  data: PropTypes.shape({
    link: PropTypes.string,
    linkParams: PropTypes.string,
    icon: PropTypes.string,
    description: PropTypes.string,
    count: PropTypes.string,
    extra: PropTypes.object,
    title: PropTypes.string,
    unit: PropTypes.string,
    subTitle: PropTypes.object,
    statUnit: PropTypes.string,
    statStatus: PropTypes.object,
    extraLabel: PropTypes.object,
    statUnitI18nKey: PropTypes.string,
  }).isRequired,
}

export default AspectWidget
