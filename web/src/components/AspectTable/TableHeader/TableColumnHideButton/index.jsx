import React from 'react'
import { func, string } from 'prop-types'
import IconButton from '@mui/material/IconButton'
import classnames from 'classnames/bind'

import messages from '../messages'
import IconProvider from '../../../IconProvider'

import styles from '../../Table.css'
import useI18n from '../../../../hooks/useI18n'

const cssClasses = classnames.bind(styles)

const TableColumnHideButton = ({ headerIndex, handleHideColumnToggle }) => {
  const { formatMessage } = useI18n()
  return (
    <IconButton
      onClick={e => handleHideColumnToggle(e, headerIndex)}
      className={cssClasses('tableheader__hidebutton')}
      data-testid={`hide_column_${headerIndex}`}
      title={formatMessage(messages.hideColumn)}
    >
      <IconProvider icon="MdVisibilityOff" className="tableheader__hidebutton" />
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
