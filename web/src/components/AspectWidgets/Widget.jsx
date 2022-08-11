import React from 'react'
import { bool, func, number, object, oneOfType, shape, string } from 'prop-types'
import classnames from 'classnames/bind'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'

import AspectLink from '../AspectLink'
import AspectTooltip from '../../oldComponents/shared/AspectTooltip'
import IconProvider from '../IconProvider'
import { buildWidgetToLinkParams, translate } from './Helpers'
import WidgetAlert from './Alerts'
import messages from './messages'

import styles from './Widgets.css'
import useI18n from '../../hooks/i18n/useI18n'

const cssClasses = classnames.bind(styles)

const EmptyWidget = () => (
  <Card className={cssClasses(['Summary__Card', 'empty__widget'])}>
    <CircularProgress variant="indeterminate" disableShrink size={24} thickness={4} />
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
  const { formatMessage } = useI18n()
  const translator = { formatMessage, messages }
  const linkParam = link ? buildWidgetToLinkParams(link, linkParams) : null
  const titleText = translate(titleI18nKey, title, translator)
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
            <AspectTooltip title={titleText} toolTipContainerClass="inline__tooltip">
              {titleText}
            </AspectTooltip>
            <span className={cssClasses('Summary__Card__Title--sub')}>
              {translate(subTitleI18nKey, subTitle, translator)}
            </span>
          </span>
          {description ? (
            <AspectTooltip showHelpIcon title={translate(descriptionI18nKey, description, translator)} />
          ) : null}
        </div>
        <div className={cssClasses('Summary__Card__Content')}>
          <div className={cssClasses('Summary__Card__Item')}>
            <div className={cssClasses('Summary__Card__Item__Count')}>
              {count} {displayAlert ? <WidgetAlert alert={alertConfig} /> : null}
            </div>
            <div className={cssClasses('Summary__Card__Item__Messages')}>
              <div className={cssClasses('Summary__Card__Item__Messages--main')}>
                {statUnitI18nKey !== null && formatMessage(messages[statUnitI18nKey], { unit })}
              </div>
              <div className={cssClasses('Summary__Card__Item__Messages--sub')}>{statStatus}</div>
            </div>
          </div>
          <div className={cssClasses('Summary__Card__Item--right')}>
            <div className={cssClasses('Summary__Card__Item__Messages')}>
              <div className={cssClasses('Summary__Card__Item__Messages--main')}>{extra}</div>
              <div className={cssClasses('Summary__Card__Item__Messages--sub')}>{extraLabel}</div>
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
    count: oneOfType([string, number]),
    extra: oneOfType([string, number]),
    title: string,
    unit: oneOfType([string, number]),
    subTitle: oneOfType([object, string]),
    statUnit: string,
    statStatus: oneOfType([string]),
    extraLabel: oneOfType([string]),
    statUnitI18nKey: string,
    alert: shape({
      config: oneOfType([object]).isRequired,
      display: oneOfType([bool, func]).isRequired,
    }),
  }).isRequired,
}

export { AspectWidget, EmptyWidget }
