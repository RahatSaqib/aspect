import React from 'react'
import { Button } from '@mui/material'
import { func, number } from 'prop-types'
import styles from '../../Table.module.css'

/**
 * Component to render page selectors for table component
 */

const PageSizeSelectors = ({ dataLength, pageSize, handleChangeRowsPerPage }) => {
  const ALL_KEY = 'All'
  const pageSizeButtonKeys = [10, 25, 50, 100, ALL_KEY]

  return pageSizeButtonKeys.map(key => {
    const classes = `${styles.pagesize__button} ${
      (key !== ALL_KEY ? key === pageSize : pageSize === dataLength) ? styles.selected : ''
    }`
    return (
      <Button
        key={key}
        className={classes}
        onClick={() => handleChangeRowsPerPage(key)}
        variant="contained"
        color="primary"
      >
        {key}
      </Button>
    )
  })
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
