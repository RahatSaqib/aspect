import React from 'react'
import { func, object, shape, string } from 'prop-types'
import classnames from 'classnames/bind'
import { useIntl } from 'react-intl'
import Card from '@material-ui/core/Card'
import CircularProgress from '@material-ui/core/CircularProgress'

import AspectLink from '../AspectLink'
import AspectTooltip from '../../components/shared/AspectTooltip'
import IconProvider from '../IconProvider'
import { buildWidgetToLinkParams, translate } from './Helpers'
import WidgetAlert from './Alerts'
import messages from './messages'

const cssClasses = classnames.bind(require('./Widgets.css'))

const EmptyWidget = () => (
  <Card className={cssClasses(['Summary__Card', 'empty__widget'])}>
    <CircularProgress
      variant="indeterminate"
      disableShrink
      size={24}
      thickness={4}
    />
  </Card>
)

const AspectWidget = ({
  data: {
    link,
    linkParams,
    icon,
    description,
    descriptionI18nKey,
    count,
    extra,
    title,
    titleI18nKey,
    unit,
    subTitle,
    subTitleI18nKey,
    statStatus,
    extraLabel,
    statUnitI18nKey,
    alert: { display: displayAlert, config: alertConfig } = {},
  },
}) => {
  const { formatMessage: intlFormatMessage } = useIntl()
  const linkParam = link ? buildWidgetToLinkParams(link, linkParams) : null
  const titleText = translate(intlFormatMessage, titleI18nKey, messages, title)
  return (
    <AspectLink
      to={linkParam}
      className={{
        active: cssClasses('Summary'),
        disabled: cssClasses('Summary', 'Summary_Link--disabled'),
      }}
    >
      <Card className={cssClasses('Summary__Card')}>
        <div className={cssClasses('Summary__Card__Title')}>
          <IconProvider icon={icon} className="summaryCard__icon" />
          <span className={cssClasses('Summary__Card__Title--main')}>
            <AspectTooltip
              title={titleText}
              toolTipContainerClass="inline__tooltip"
            >
              {titleText}
            </AspectTooltip>
            <span className={cssClasses('Summary__Card__Title--sub')}>
              {translate(
                intlFormatMessage,
                subTitleI18nKey,
                messages,
                subTitle
              )}
            </span>
          </span>
          {description ? (
            <AspectTooltip
              showHelpIcon
              title={translate(
                intlFormatMessage,
                descriptionI18nKey,
                messages,
                description
              )}
            />
          ) : null}
        </div>
        <div className={cssClasses('Summary__Card__Content')}>
          <div className={cssClasses('Summary__Card__Item')}>
            <div className={cssClasses('Summary__Card__Item__Count')}>
              {count}{' '}
              {displayAlert ? <WidgetAlert alert={alertConfig} /> : null}
            </div>
            <div className={cssClasses('Summary__Card__Item__Messages')}>
              <div
                className={cssClasses('Summary__Card__Item__Messages--main')}
              >
                {statUnitI18nKey !== null &&
                  intlFormatMessage(messages[statUnitI18nKey], { unit })}
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
  data: shape({
    link: string,
    linkParams: string,
    icon: string,
    description: string,
    count: string,
    extra: object,
    title: string,
    unit: string,
    subTitle: object,
    statUnit: string,
    statStatus: object,
    extraLabel: object,
    statUnitI18nKey: string,
    alert: shape({
      config: object.isRequired,
      display: func.isRequired,
    }),
  }).isRequired,
}

export { AspectWidget, EmptyWidget }
