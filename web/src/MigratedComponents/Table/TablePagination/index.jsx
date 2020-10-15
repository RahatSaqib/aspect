import React, { Fragment } from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'

import PageSizeSelectors from './PageSizeSelectors'
import PageIndexSelectors from './PageIndexSelectors'

const cssClasses = classnames.bind(require('../Table.css'))

const ShowingOfCount = ({ from, to, count }) => (
  <div>{`${from}-${to} of ${count} items`}</div>
)

const AspectPagination = ({
  canNextPage,
  canPreviousPage,
  gotoPage,
  dataLength,
  nextPage,
  pageCount,
  pageSize,
  pageIndex,
  previousPage,
  handleChangeRowsPerPage,
}) => {
  return (
    <Fragment>
      <div className={cssClasses('pagination__container')}>
        <div className={cssClasses('pagination__leftActions')}>
          <PageIndexSelectors
            canNextPage={canNextPage}
            canPreviousPage={canPreviousPage}
            dataLength={dataLength}
            gotoPage={gotoPage}
            nextPage={nextPage}
            pageCount={pageCount}
            pageIndex={pageIndex}
            previousPage={previousPage}
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
      <pre>
        <code>
          {JSON.stringify(
            {
              dataLength,
              pageIndex,
              pageSize,
              pageCount,
              canNextPage,
              canPreviousPage,
            },
            null,
            2
          )}
        </code>
      </pre>
    </Fragment>
  )
}

AspectPagination.propTypes = {
  dataLength: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  pageIndex: PropTypes.number.isRequired,
  canNextPage: PropTypes.bool.isRequired,
  canPreviousPage: PropTypes.bool.isRequired,
  gotoPage: PropTypes.func.isRequired,
  nextPage: PropTypes.func.isRequired,
  pageCount: PropTypes.number.isRequired,
  previousPage: PropTypes.func.isRequired,
  handleChangeRowsPerPage: PropTypes.func.isRequired,
}

export default AspectPagination
