import React from 'react'
import { IconButton } from '@mui/material'
import classnames from 'classnames/bind'
import { bool, func, number } from 'prop-types'
import useI18n from '../../../../hooks/useI18n'
import IconProvider from '../../../IconProvider'
import styles from '../../Table.css'
import messages from '../messages'

const cssClasses = classnames.bind(styles)

/**
 * Component to allow rows to be grouped for this column
 */

const TableColumnGroupBy = ({ headerIndex, handleGroupByColumnToggle, isGrouped }) => {
  const { formatMessage } = useI18n()
  return isGrouped ? (
    <IconButton
      onClick={e => handleGroupByColumnToggle(e, headerIndex)}
      className={cssClasses('tableheader__groupbybutton')}
      data-testid={`ungroup_${headerIndex}`}
      title={formatMessage(messages.unGroupByColumn)}
    >
      <IconProvider icon="FaCheckSquare" className="tableheader__groupbybutton" />
    </IconButton>
  ) : (
    <IconButton
      onClick={e => handleGroupByColumnToggle(e, headerIndex)}
      className={cssClasses('tableheader__groupbybutton')}
      data-testid={`group_${headerIndex}`}
      title={formatMessage(messages.groupByColumn)}
    >
      <IconProvider icon="FaRegCheckSquare" className="tableheader__groupbybutton" />
    </IconButton>
  )
}

TableColumnGroupBy.defaultProps = {
  /**
    Index int for the currently grouped column
  */
  headerIndex: number.isRequired,
  /**
    Function to handle grouping toggle
  */
  handleGroupByColumnToggle: func.isRequired,
  /**
    Boolean to check if rows are grouped per column
  */
  isGrouped: bool.isRequired,
}

export default TableColumnGroupBy
