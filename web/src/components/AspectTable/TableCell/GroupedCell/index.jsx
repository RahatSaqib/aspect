import React from 'react'
import { IconButton } from '@mui/material'
import { array, bool, func, number, object, oneOfType, shape, string } from 'prop-types'
import useI18n from '../../../../hooks/useI18n'
import IconProvider from '../../../IconProvider'
import styles from '../../Table.module.css'
import Cell from '../Cell'
import messages from '../messages'

/**
 * Component to render a grouped cell
 */

const GroupedCell = ({
  format,
  getToggleRowExpandedProps,
  isExpanded,
  render,
  subRows: { length: subRowsLength },
  value,
}) => {
  const { formatMessage } = useI18n()
  return (
    <div className={styles.tablecell__grouped}>
      <IconButton
        {...getToggleRowExpandedProps()}
        className={styles.tablecell__expandbutton}
        title={formatMessage(messages.expandRow)}
      >
        {isExpanded ? <IconProvider icon="MdUnfoldLess" /> : <IconProvider icon="MdUnfoldMore" />}
      </IconButton>
      <Cell render={render} format={format} value={value} /> ({subRowsLength})
    </div>
  )
}

GroupedCell.propTypes = {
  /**
    Function to format the cell
  */
  format: func.isRequired,
  /**
    Function exposed by react-table
  */
  getToggleRowExpandedProps: oneOfType([object]).isRequired,
  /**
    Bool to check expanded state of cell
  */
  isExpanded: bool.isRequired,
  /**
    Function exposed by react-table
  */
  render: func.isRequired,
  /**
    Count of rows nested below this grouped cell
  */
  subRows: shape({
    length: number,
  }).isRequired,
  /**
    Value for the cell to render
  */
  value: oneOfType([array, string, number]).isRequired,
}

export default GroupedCell
