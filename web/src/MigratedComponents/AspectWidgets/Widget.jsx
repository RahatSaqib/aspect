import React from 'react'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import Card from '@material-ui/core/Card'

import AspectLink from '../../components/shared/AspectLink'
import AspectTooltip from '../../components/shared/AspectTooltip'
import IconProvider from '../IconProvider'
import messages from './messages'

const cssClasses = classnames.bind(require('./Widgets.css'))

const AspectWidgetGroup = ({ data }) => {
  const { formatMessage: intlFormatMessage } = useIntl()

  const {
    link,
    icon,
    description,
    count,
    extra,
    title,
    titleI18nKey,
    subTitleI18nKey,
    extraUnitI18nKey,
    extraLabelI18nKey,
    statUnitI18nKey,
    statStatusI18nKey,
  } = data
  // console.log(data)

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
              {/* {subTitleI18nKey && intlFormatMessage(messages[subTitleI18nKey])} */}
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
                {/* {!statUnitI18nKey && intlFormatMessage(messages[statUnitI18nKey])} */}
              </div>
              <div className={cssClasses('Summary__Card__Item__Messages--sub')}>
                {/* {statStatusI18nKey && intlFormatMessage(messages[statStatusI18nKey])} */}
              </div>
            </div>
          </div>
          <div className={cssClasses('Summary__Card__Item--right')}>
            <div className={cssClasses('Summary__Card__Item__Messages')}>
              <div
                className={cssClasses('Summary__Card__Item__Messages--main')}
              >
                {extra}
                {/* {extraUnitI18nKey && intlFormatMessage(messages[extraUnitI18nKey])} */}
              </div>
              <div className={cssClasses('Summary__Card__Item__Messages--sub')}>
                {/* {extraLabelI18nKey &&  intlFormatMessage(messages[extraLabelI18nKey])} */}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </AspectLink>
  )
}

export default AspectWidgetGroup
