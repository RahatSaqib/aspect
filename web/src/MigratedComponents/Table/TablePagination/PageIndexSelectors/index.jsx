import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import Button from '@material-ui/core/Button'
import classnames from 'classnames/bind'

import messages from '../messages'
import IndexButton from './IndexButton'
import { getCurrentVisibleRows } from '../../Helpers'

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
  page,
}) => {
  const intl = useIntl()
  const nowShowing = getCurrentVisibleRows(dataLength, page, name)
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
      <div>{nowShowing}</div>
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
  gotoPage: PropTypes.func.isRequired,
  nextPage: PropTypes.func.isRequired,
  pageCount: PropTypes.number.isRequired,
  previousPage: PropTypes.func.isRequired,
}

export default PageIndexSelectors
