import React from 'react'
import { Card, CircularProgress } from '@mui/material'
import { bool, func, number, object, oneOfType, shape, string } from 'prop-types'
import { useNavigate } from 'react-router'
import useI18n from '../../hooks/useI18n'
import AspectTooltip from '../../oldComponents/shared/AspectTooltip'
import { useFilterUpdate } from '../../providers/FilterProvider'
import { formatNumber } from '../../utils/utils/number'
import IconProvider from '../IconProvider'
import WidgetAlert from './Alerts'
import { buildWidgetParams, translate } from './Helpers'
import messages from './messages'
import styles from './Widgets.module.css'

const EmptyWidget = () => (
  <Card className={`${styles.Summary__Card} ${styles.empty__widget}`}>
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
  const [addFilter] = useFilterUpdate()
  const navigate = useNavigate()
  const translator = { formatMessage, messages }
  const params = link ? buildWidgetParams(link, linkParams) : null
  const titleText = translate(titleI18nKey, title, translator)

  const goToLink = () => {
    if (link) {
      addFilter({ ...params }, link)
      navigate(link)
    }
  }

  return (
    <span className={styles.Summary}>
      <Card className={`${styles.Summary} ${styles.Summary__Card}`} onClick={() => goToLink()}>
        <div className={styles.Summary__Card__Title}>
          <IconProvider icon={icon} className={styles.summaryCard__icon} />
          <span className={styles.Summary__Card__Title__main}>
            <AspectTooltip title={titleText} toolTipContainerClass="inline__tooltip">
              {titleText}
            </AspectTooltip>
            <span className={styles.Summary__Card__Title__sub}>{translate(subTitleI18nKey, subTitle, translator)}</span>
          </span>
          {description ? (
            <AspectTooltip showHelpIcon title={translate(descriptionI18nKey, description, translator)} />
          ) : null}
        </div>
        <div className={styles.Summary__Card__Content}>
          <div className={styles.Summary__Card__Item}>
            <div className={styles.Summary__Card__Item__Count}>
              {formatNumber(count)} {displayAlert ? <WidgetAlert alert={alertConfig} /> : null}
            </div>
            <div className={styles.Summary__Card__Item__Messages}>
              <div className={styles.Summary__Card__Item__Messages__main}>
                {statUnitI18nKey !== null && formatMessage(messages[statUnitI18nKey], { unit })}
              </div>
              <div className={styles.Summary__Card__Item__Messages__sub}>{statStatus}</div>
            </div>
          </div>
          <div className={styles.Summary__Card__Item__right}>
            <div className={styles.Summary__Card__Item__Messages}>
              <div className={styles.Summary__Card__Item__Messages__main}>{extra}</div>
              <div className={styles.Summary__Card__Item__Messages__sub}>{extraLabel}</div>
            </div>
          </div>
        </div>
      </Card>
    </span>
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
