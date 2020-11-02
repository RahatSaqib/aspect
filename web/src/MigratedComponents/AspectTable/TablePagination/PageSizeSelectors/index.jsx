import React from 'react'
import PropTypes from 'prop-types'
import Button from '@material-ui/core/Button'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('../../Table.css'))

const PageSizeSelectors = ({
  dataLength,
  pageSize,
  handleChangeRowsPerPage,
}) => {
  const ALL_KEY = 'All'
  const pageSizeButtonKeys = [10, 25, 50, 100, ALL_KEY]
  return pageSizeButtonKeys.map(key => (
    <Button
      key={key}
      className={cssClasses('pagesize__button', {
        selected: key !== ALL_KEY ? key === pageSize : pageSize === dataLength,
      })}
      onClick={() => handleChangeRowsPerPage(key)}
      variant="contained"
      color="primary"
    >
      {key}
    </Button>
  ))
}

PageSizeSelectors.proptTypes = {
  dataLength: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  handleChangeRowsPerPage: PropTypes.func.isRequired,
}

export default PageSizeSelectors
