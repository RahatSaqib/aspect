import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import { defineMessage, useIntl } from 'react-intl'
import Card from '@material-ui/core/Card'

import _ from 'lodash'
import AspectLink from '../../components/shared/AspectLink'
import AspectTooltip from '../../components/shared/AspectTooltip'
import IconProvider from '../IconProvider'
import { buildMessagesFromI18nKeys } from './Helpers'

const cssClasses = classnames.bind(require('./Widgets.css'))

const AspectWidget = ({
  data,
  data: {
    link,
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

  return (
    <AspectLink
      to={link}
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
