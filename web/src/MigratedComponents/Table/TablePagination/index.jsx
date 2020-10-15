import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'

import PageSizeSelectors from './PageSizeSelectors'
import PageIndexSelectors from './PageIndexSelectors'

const cssClasses = classnames.bind(require('../Table.css'))

const AspectPagination = ({
  canNextPage,
  canPreviousPage,
  dataLength,
  gotoPage,
  handleChangeRowsPerPage,
  name,
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
        pageSize={pageSize}
        handleChangeRowsPerPage={handleChangeRowsPerPage}
      />
    </div>
  </div>
)

AspectPagination.propTypes = {
  dataLength: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  pageIndex: PropTypes.number.isRequired,
  canNextPage: PropTypes.bool.isRequired,
  canPreviousPage: PropTypes.bool.isRequired,
  gotoPage: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  nextPage: PropTypes.func.isRequired,
  page: PropTypes.oneOfType([PropTypes.array]).isRequired,
  pageCount: PropTypes.number.isRequired,
  previousPage: PropTypes.func.isRequired,
  handleChangeRowsPerPage: PropTypes.func.isRequired,
}

export default AspectPagination
