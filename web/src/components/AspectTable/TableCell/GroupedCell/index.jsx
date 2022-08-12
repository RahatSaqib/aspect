import React from 'react'
import { array, bool, func, number, object, oneOfType, shape, string } from 'prop-types'
import IconButton from '@mui/material/IconButton'
import classnames from 'classnames/bind'

import messages from '../messages'
import IconProvider from '../../../IconProvider'
import Cell from '../Cell'

import styles from '../../Table.css'
import useI18n from '../../../../hooks/useI18n'

const cssClasses = classnames.bind(styles)

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
    <div className={cssClasses('tablecell__grouped')}>
      <IconButton
        {...getToggleRowExpandedProps()}
        className={cssClasses('tablecell__expandbutton')}
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
