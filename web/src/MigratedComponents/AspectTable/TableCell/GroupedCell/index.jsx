import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import IconButton from '@material-ui/core/IconButton'
import classnames from 'classnames/bind'

import messages from '../messages'
import IconProvider from '../../../IconProvider'
import Cell from '../Cell'

const cssClasses = classnames.bind(require('../../Table.css'))

const GroupedCell = ({
  format,
  getToggleRowExpandedProps,
  isExpanded,
  render,
  subRows: { length: subRowsLength },
  value,
}) => {
  const { formatMessage } = useIntl()
  return (
    <div className={cssClasses('tablecell__grouped')}>
      <IconButton
        {...getToggleRowExpandedProps()}
        className={cssClasses('tablecell__expandbutton')}
        title={formatMessage(messages.expandRow)}
      >
        {isExpanded ? (
          <IconProvider icon="MdUnfoldLess" />
        ) : (
          <IconProvider icon="MdUnfoldMore" />
        )}
      </IconButton>
      <Cell render={render} format={format} value={value} /> ({subRowsLength})
    </div>
  )
}

GroupedCell.propTypes = {
  format: PropTypes.func.isRequired,
  getToggleRowExpandedProps: PropTypes.oneOf([PropTypes.object]).isRequired,
  isExpanded: PropTypes.bool.isRequired,
  render: PropTypes.func.isRequired,
  subRows: PropTypes.shape({
    length: PropTypes.number,
  }).isRequired,
  value: PropTypes.oneOf([PropTypes.array, PropTypes.string, PropTypes.number])
    .isRequired,
}

export default GroupedCell
