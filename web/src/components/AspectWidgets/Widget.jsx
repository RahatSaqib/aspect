import React from 'react'
import { Card, CircularProgress } from '@mui/material'
import { bool, func, number, object, oneOfType, shape, string } from 'prop-types'
import { useIntl } from 'react-intl'
import { useNavigate } from 'react-router'
import useFilterUpdate from '../../hooks/useFilterUpdate'
import useFilterValues from '../../hooks/useFilterValues'
import AspectTooltip from '../../components/shared/AspectTooltip'
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
  const { formatMessage } = useIntl()
  const [addFilter] = useFilterUpdate()
  const navigate = useNavigate()
  const filter = useFilterValues(link)

  const translator = { formatMessage, messages }
  const params = link ? buildWidgetParams(link, linkParams) : null
  const titleText = translate(titleI18nKey, title, translator)

  const goToLink = () => {
    if (link) {
      addFilter({ ...filter, ...params }, link)
      navigate(link)
    }
  }
  const maxLengthWithoutLineWrapping = 13
  const countClass = count.length > maxLengthWithoutLineWrapping ? `${styles.Summary__Card__Item__Count__Small}` : ``

  return (
    <span className={styles.Summary}>
      <Card className={`${styles.Summary} ${styles.Summary__Card}`} onClick={() => goToLink()}>
        <div className={styles.Summary__Card__Title}>
          <IconProvider icon={icon} className={styles.summaryCard__icon} />
          <span className={styles.Summary__Card__Title__main}>
            <AspectTooltip title={titleText} toolTipContainerClass={styles.inline__tooltip}>
              {titleText}
            </AspectTooltip>
            <span className={styles.Summary__Card__Title__sub}>{translate(subTitleI18nKey, subTitle, translator)}</span>
          </span>
          {description ? (
            <AspectTooltip showHelpIcon title={translate(descriptionI18nKey, description, translator)} />
          ) : null}
        </div>
        <div className={styles.Summary__Card__Content}>
          {statStatus && extra && extraLabel ? (
            <div className={styles.Summary__Card__Badges}>
              <div className={styles.Summary__Card__Badge}>
                <span className={styles.Summary__Card__Badge__value}>{count}</span>
                <span className={styles.Summary__Card__Badge__label}>{statStatus}</span>
              </div>
              <div className={styles.Summary__Card__Badge}>
                <span className={styles.Summary__Card__Badge__value}>{extra}</span>
                <span className={styles.Summary__Card__Badge__label}>{extraLabel}</span>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.Summary__Card__Item}>
                <div className={styles.Summary__Card__Item__Count}>
                  <span className={countClass}>{count}</span>{' '}
                  {displayAlert ? <WidgetAlert alert={alertConfig} /> : null}
                </div>
                <div className={styles.Summary__Card__Item__Messages}>
                  <div className={styles.Summary__Card__Item__Messages__main}>
                    {statUnitI18nKey !== null && formatMessage(messages[statUnitI18nKey], { unit })}
                  </div>
                  <div className={styles.Summary__Card__Item__Messages__sub}>{statStatus}</div>
                </div>
              </div>
              <div className={styles.Summary__Card__Item__right}>
                <div className={styles.Summary__Card__Item__Count}>
                  <span>{extra}</span>
                </div>
                <div className={styles.Summary__Card__Item__Messages}>
                  <div className={styles.Summary__Card__Item__Messages__sub}>{extraLabel}</div>
                </div>
              </div>
            </>
          )}
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
