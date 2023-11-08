import React from 'react'
import { Button, CircularProgress, Tooltip } from '@mui/material'
import { bool, func } from 'prop-types'
import { defineMessages } from 'react-intl'
import useI18n from '../../../hooks/useI18n'
import IconProvider from '../../IconProvider'
import styles from '../Table.module.css'

const messages = defineMessages({
  resetTableMessage: {
    id: 'pages.Table.ResetTable.resetTableMessage',
    defaultMessage: 'Reset all filters',
  },
})

const AspectTableReset = ({ isFetching, action }) => {
  const { formatMessage } = useI18n()
  return (
    <div className={styles.table__reload}>
      <Tooltip
        placement="left"
        title={formatMessage(messages.resetTableMessage)}
        disableHoverListener={isFetching}
        disableInteractive
      >
        <Button size="small" disabled={isFetching} onClick={action}>
          {isFetching ? (
            <div className={styles.tablereload__waiting}>
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
