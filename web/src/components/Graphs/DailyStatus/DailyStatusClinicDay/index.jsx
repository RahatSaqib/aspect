import React from 'react'
import filter from 'lodash/filter'
import isEmpty from 'lodash/isEmpty'
import noop from 'lodash/noop'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import AspectTooltip from '../../../../components/shared/AspectTooltip'
import styles from '../DailyStatus.module.css'
import { getDayTitle } from '../Helpers'
import messages from '../messages'

const DayBlock = ({ consts, dayModifier, onClick }) => {
  const {
    blockSize: { width: blockWidth, height: blockHeight, marginWidth },
  } = consts
  return (
    <div
      className={`${styles.clinic__day} ${styles[`clinic__day__${dayModifier}`]}`}
      style={{
        width: `${blockWidth}px`,
        height: `${blockHeight}px`,
        margin: `0 ${marginWidth / 2}px`,
      }}
      onClick={onClick}
      role="presentation"
    />
  )
}

DayBlock.defaultProps = {
  dayModifier: null,
}
DayBlock.propTypes = {
  dayModifier: PropTypes.string,
  consts: PropTypes.shape({
    blockSize: PropTypes.oneOfType([PropTypes.object]),
  }).isRequired,
  onClick: PropTypes.func.isRequired,
}

const DailyStatusClinicDay = ({
  consts,
  daysInSameStatus,
  isWeekend,
  maintenanceStatusName,
  maintenanceStatusManuallySetBy,
  maintenanceStatusI18nKey,
  maintenanceStatusExternalId,
  statuses,
  totalResults,
  onClickDay,
}) => {
  const { formatDate, formatMessage } = useIntl()
  const isActive = maintenanceStatusI18nKey === 'active' || maintenanceStatusI18nKey === 'reportedActive'
  const isEditable = maintenanceStatusExternalId !== 'active'
  const { weekend } = consts
  const { checked } =
    filter(statuses, {
      i18nKey: maintenanceStatusI18nKey,
    })[0] || false

  let dayModifier = isWeekend ? weekend : null
  if (checked) {
    dayModifier = isActive ? maintenanceStatusI18nKey : isWeekend ? weekend : maintenanceStatusI18nKey
  }

  const title = getDayTitle({
    checked,
    daysInSameStatus,
    formatMessage,
    isActive,
    maintenanceStatusName,
    totalResults,
    messages,
    maintenanceStatusI18nKey,
  })

  const manuallySet = !isEmpty(maintenanceStatusManuallySetBy)
    ? `; ${formatMessage(messages.toolTipLastUpdatedBy, {
        username: maintenanceStatusManuallySetBy.name,
        updatedDate: formatDate(new Date(maintenanceStatusManuallySetBy.updatedDate)),
      })}`
    : ''

  return (
    <AspectTooltip
      showPointerCursor={isEditable}
      title={!isEditable ? `${title}, ${formatMessage(messages.toolTipTitleNotEditable)}` : `${title}${manuallySet}`}
      toolTipContainerClass={styles.inline__tooltip}
      placement="right"
    >
      <DayBlock consts={consts} dayModifier={dayModifier} onClick={isEditable ? onClickDay : noop} />
    </AspectTooltip>
  )
}

DailyStatusClinicDay.defaultProps = {
  maintenanceStatusName: false,
  maintenanceStatusManuallySetBy: {},
  totalResults: 0,
  daysInSameStatus: 1,
  maintenanceStatusI18nKey: '',
  maintenanceStatusExternalId: '',
  statuses: [],
}

DailyStatusClinicDay.propTypes = {
  isWeekend: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]).isRequired,
  maintenanceStatusI18nKey: PropTypes.string,
  maintenanceStatusName: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  maintenanceStatusManuallySetBy: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    updatedDate: PropTypes.string,
  }),
  maintenanceStatusExternalId: PropTypes.string,
  daysInSameStatus: PropTypes.number,
  statuses: PropTypes.oneOfType([PropTypes.bool, PropTypes.arrayOf(PropTypes.object)]),
  consts: PropTypes.shape({
    weekend: PropTypes.string,
  }).isRequired,
  totalResults: PropTypes.number,
  onClickDay: PropTypes.func.isRequired,
}

export { DailyStatusClinicDay, DayBlock }
