import React from 'react'
import { IconButton } from '@mui/material'
import { func, string } from 'prop-types'
import { useIntl } from 'react-intl'
import IconProvider from '../../../IconProvider'
import styles from '../../Table.module.css'
import messages from '../messages'

const TableColumnHideButton = ({ headerIndex, handleHideColumnToggle }) => {
  const { formatMessage } = useIntl()
  return (
    <IconButton
      onClick={e => handleHideColumnToggle(e, headerIndex)}
      className={styles.tableheader__hidebutton}
      data-testid={`hide_column_${headerIndex}`}
      title={formatMessage(messages.hideColumn)}
    >
      <IconProvider icon="MdVisibilityOff" className={styles.tableheader__hidebutton} />
    </IconButton>
  )
}

TableColumnHideButton.propTypes = {
  /**
    Index for the header within the group
  */
  headerIndex: string.isRequired,
  /**
    Function to handle column visibility toggle
  */
  handleHideColumnToggle: func.isRequired,
}

export default TableColumnHideButton
