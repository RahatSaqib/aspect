import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'

import messages from '../messages'
import IndexButton from './IndexButton'
import NowShowing from './NowShowing'

const cssClasses = classnames.bind(require('../../Table.css'))

const PageIndexSelectors = ({
  canNextPage,
  canPreviousPage,
  dataLength,
  gotoPage,
  name,
  nextPage,
  pageCount,
  pageIndex,
  pageSize,
  previousPage,
}) => {
  const intl = useIntl()
  return (
    <div className={cssClasses('pageindex__container')}>
      <IndexButton
        modifier="left"
        disabled={!canPreviousPage}
        action={() => gotoPage(0)}
        icon="FaAngleDoubleLeft"
        label={intl.formatMessage(messages.first)}
      />
      <IndexButton
        modifier="left"
        disabled={!canPreviousPage}
        action={() => previousPage()}
        icon="FaAngleLeft"
        label={intl.formatMessage(messages.previous)}
      />
      <NowShowing
        dataLength={dataLength}
        pageIndex={pageIndex}
        pageSize={pageSize}
        name={name}
      />
      <IndexButton
        modifier="right"
        disabled={!canNextPage}
        action={() => nextPage()}
        icon="FaAngleRight"
        label={intl.formatMessage(messages.next)}
      />
      <IndexButton
        modifier="right"
        disabled={!canNextPage}
        action={() => gotoPage(pageCount - 1)}
        icon="FaAngleDoubleRight"
        label={intl.formatMessage(messages.last)}
      />
    </div>
  )
}

PageIndexSelectors.propTypes = {
  canNextPage: PropTypes.bool.isRequired,
  canPreviousPage: PropTypes.bool.isRequired,
  dataLength: PropTypes.number.isRequired,
  gotoPage: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  nextPage: PropTypes.func.isRequired,
  pageIndex: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  pageCount: PropTypes.number.isRequired,
  previousPage: PropTypes.func.isRequired,
}

export default PageIndexSelectors
