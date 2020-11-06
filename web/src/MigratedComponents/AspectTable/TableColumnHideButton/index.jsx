import React from 'react'
import PropTypes from 'prop-types'
import IconButton from '@material-ui/core/IconButton'
import classnames from 'classnames/bind'
import IconProvider from '../../IconProvider'

const cssClasses = classnames.bind(require('../Table.css'))

const TableColumnHideButton = ({ headerId, handleHideColumnToggle }) => {
  return (
    <IconButton
      onClick={e => handleHideColumnToggle(e, headerId)}
      className={cssClasses('tableheader__hidebutton')}
      data-testid={`hide_column_${headerId}`}
    >
      <IconProvider icon="MdVisibilityOff" />
    </IconButton>
  )
}

TableColumnHideButton.propTypes = {
  headerId: PropTypes.string.isRequired,
  handleHideColumnToggle: PropTypes.func.isRequired,
}

export default TableColumnHideButton
