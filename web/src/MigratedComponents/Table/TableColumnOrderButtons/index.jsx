import React from 'react'
import PropTypes from 'prop-types'
import IconButton from '@material-ui/core/IconButton'
import { MdChevronLeft, MdChevronRight } from 'react-icons/md'

import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('../Table.css'))

const TableColumnOrderButtons = ({
  headerIndex,
  headersLength,
  handleChangeColumnOrder,
}) => {
  return (
    <div className={cssClasses('tableheader__orderbuttons')}>
      <IconButton
        disabled={headerIndex <= 0}
        onClick={e => handleChangeColumnOrder(e, 'left', headerIndex)}
        className={cssClasses('tableheader__orderbutton')}
      >
        <MdChevronLeft />
      </IconButton>
      <IconButton
        disabled={headerIndex + 1 >= headersLength}
        onClick={e => handleChangeColumnOrder(e, 'right', headerIndex)}
        className={cssClasses('tableheader__orderbutton')}
      >
        <MdChevronRight />
      </IconButton>
    </div>
  )
}

TableColumnOrderButtons.propTypes = {
  headerIndex: PropTypes.number.isRequired,
  headersLength: PropTypes.number.isRequired,
  handleChangeColumnOrder: PropTypes.func.isRequired,
}

export default TableColumnOrderButtons
