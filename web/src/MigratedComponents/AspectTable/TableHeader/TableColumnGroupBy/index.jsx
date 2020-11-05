import React from 'react'
import PropTypes from 'prop-types'
import IconButton from '@material-ui/core/IconButton'
import classnames from 'classnames/bind'

import IconProvider from '../../../IconProvider'

const cssClasses = classnames.bind(require('../../Table.css'))

const TableColumnGroupBy = ({
  headerIndex,
  handleGroupByColumnToggle,
  isGrouped,
}) => {
  return isGrouped ? (
    <IconButton
      onClick={e => handleGroupByColumnToggle(e, headerIndex)}
      className={cssClasses('tableheader__groupbybutton')}
      data-testid={`ungroup_${headerIndex}`}
      title="Ungroup Column"
    >
      <IconProvider icon="FaCheckSquare" />
    </IconButton>
  ) : (
    <IconButton
      onClick={e => handleGroupByColumnToggle(e, headerIndex)}
      className={cssClasses('tableheader__groupbybutton')}
      data-testid={`group_${headerIndex}`}
      title="Group by Column"
    >
      <IconProvider icon="FaRegCheckSquare" />
    </IconButton>
  )
}

TableColumnGroupBy.defaultProps = {
  headerIndex: PropTypes.number.isRequired,
  handleGroupByColumnToggle: PropTypes.func.isRequired,
  isGrouped: PropTypes.bool.isRequired,
}

export default TableColumnGroupBy
