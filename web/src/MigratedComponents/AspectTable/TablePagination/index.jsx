import React from 'react'
import { array, bool, func, number, oneOfType, string } from 'prop-types'
import classnames from 'classnames/bind'

import PageSizeSelectors from './PageSizeSelectors'
import PageIndexSelectors from './PageIndexSelectors'

import styles from '../Table.css'

const cssClasses = classnames.bind(styles)

/**
 * Component to render pagination
 */

const AspectPagination = ({
  canNextPage,
  canPreviousPage,
  dataLength,
  gotoPage,
  handleChangeRowsPerPage,
  name,
  namePlural,
  nextPage,
  pageCount,
  pageIndex,
  pageSize,
  previousPage,
  page,
}) => (
  <div className={cssClasses('pagination__container')}>
    <div className={cssClasses('pagination__leftActions')}>
      <PageIndexSelectors
        canNextPage={canNextPage}
        canPreviousPage={canPreviousPage}
        dataLength={dataLength}
        gotoPage={gotoPage}
        nextPage={nextPage}
        name={name}
        namePlural={namePlural}
        pageCount={pageCount}
        pageIndex={pageIndex}
        previousPage={previousPage}
        pageSize={pageSize}
        page={page}
      />
    </div>
    <div className={cssClasses('pagination__rightActions')}>
      <PageSizeSelectors
        dataLength={dataLength}
        pageIndex={pageIndex}
        pageSize={pageSize}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </div>
  </div>
)

AspectPagination.propTypes = {
  /**
    Length of data to be rendered, needed for calcs
  */
  dataLength: number.isRequired,
  /**
    Total rows shown per page
  */
  pageSize: number.isRequired,
  /**
    Current page index (starts at zero)
  */
  pageIndex: number.isRequired,
  /**
    Boolean to allow next page
  */
  canNextPage: bool.isRequired,
  /**
    Boolean to allow previous page
  */
  canPreviousPage: bool.isRequired,
  /**
    Function to navigate to page provided as int
  */
  gotoPage: func.isRequired,
  /**
    Name of the type of records
  */
  name: string.isRequired,
  /**
    Plural of the name
  */
  namePlural: string.isRequired,
  /**
    Function to move to immediate next page
  */
  nextPage: func.isRequired,
  /**
    Array of page data
  */
  page: oneOfType([array]).isRequired,
  /**
    Length of data to be rendered, needed for calcs
  */
  pageCount: number.isRequired,
  /**
    Function to move to immediate previous page
  */
  previousPage: func.isRequired,
  /**
    Function to handle row count change
  */
  handleChangeRowsPerPage: func.isRequired,
}

export default AspectPagination
