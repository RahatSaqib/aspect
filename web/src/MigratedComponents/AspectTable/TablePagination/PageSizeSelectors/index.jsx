import React from 'react'
import { func, number } from 'prop-types'
import Button from '@material-ui/core/Button'
import classnames from 'classnames/bind'

import styles from '../../Table.css'

const cssClasses = classnames.bind(styles)

/**
 * Component to render page selectors for table component
 */

const PageSizeSelectors = ({ dataLength, pageSize, handleChangeRowsPerPage }) => {
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
  /**
    Length of data to be rendered, needed for calcs
  */
  dataLength: number.isRequired,
  /**
    Page size number sent from component selector
  */
  pageSize: number.isRequired,
  /**
    Function to handle updates to selected page size
  */
  handleChangeRowsPerPage: func.isRequired,
}

export default PageSizeSelectors
