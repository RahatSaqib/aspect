import React from 'react'
import { func, string } from 'prop-types'
import { useIntl } from 'react-intl'
import IconButton from '@material-ui/core/IconButton'
import classnames from 'classnames/bind'

import messages from '../messages'
import IconProvider from '../../../IconProvider'

import styles from '../../Table.css'

const cssClasses = classnames.bind(styles)

const TableColumnHideButton = ({ headerIndex, handleHideColumnToggle }) => {
  const { formatMessage } = useIntl()
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
