import React from 'react'
import { bool, func } from 'prop-types'
import classnames from 'classnames/bind'
import Button from '@material-ui/core/Button'
import CircularProgress from '@material-ui/core/CircularProgress'
import Tooltip from '@material-ui/core/Tooltip'
import { defineMessages } from 'react-intl'

import IconProvider from '../../IconProvider'

import styles from '../Table.css'
import useI18n from '../../../Hooks/i18n/useI18n'

const cssClasses = classnames.bind(styles)

const messages = defineMessages({
  resetTableMessage: {
    id: 'pages.Table.ResetTable.resetTableMessage',
    defaultMessage: 'Reset all filters',
  },
})

const AspectTableReset = ({ isFetching, action }) => {
  const { formatMessage } = useI18n()
  return (
    <div className={cssClasses('table__reload')}>
      <Tooltip
        placement="left"
        title={formatMessage(messages.resetTableMessage)}
        disableHoverListener={isFetching}
        disableInteractive
      >
        <Button size="small" disabled={isFetching} onClick={action}>
          {isFetching ? (
            <div className={cssClasses('tablereload__waiting')}>
              <CircularProgress />
            </div>
          ) : (
            <IconProvider icon="MdDeleteSweep" className="summaryCard__icon" />
          )}
        </Button>
      </Tooltip>
    </div>
  )
}

AspectTableReset.propTypes = {
  isFetching: bool.isRequired,
  action: func.isRequired,
}

export default AspectTableReset
