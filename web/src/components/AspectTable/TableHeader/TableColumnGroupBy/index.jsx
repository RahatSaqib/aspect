import React from 'react'
import { IconButton } from '@mui/material'
import { bool, func, number } from 'prop-types'
import useI18n from '../../../../hooks/useI18n'
import IconProvider from '../../../IconProvider'
import styles from '../../Table.module.css'
import messages from '../messages'

/**
 * Component to allow rows to be grouped for this column
 */

const TableColumnGroupBy = ({ headerIndex, handleGroupByColumnToggle, isGrouped }) => {
  const { formatMessage } = useI18n()
  return isGrouped ? (
    <IconButton
      onClick={e => handleGroupByColumnToggle(e, headerIndex)}
      className={styles.tableheader__groupbybutton}
      data-testid={`ungroup_${headerIndex}`}
      title={formatMessage(messages.unGroupByColumn)}
    >
      <IconProvider icon="FaCheckSquare" className={styles.tableheader__groupbybutton} />
    </IconButton>
  ) : (
    <IconButton
      onClick={e => handleGroupByColumnToggle(e, headerIndex)}
      className={styles.tableheader__groupbybutton}
      data-testid={`group_${headerIndex}`}
      title={formatMessage(messages.groupByColumn)}
    >
      <IconProvider icon="FaRegCheckSquare" className={styles.tableheader__groupbybutton} />
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
