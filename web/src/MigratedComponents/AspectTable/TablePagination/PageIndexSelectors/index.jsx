import React from 'react'
import { bool, func, number, string } from 'prop-types'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'

import messages from '../messages'
import IndexButton from './IndexButton'
import NowShowing from './NowShowing'

import styles from '../../Table.css'

const cssClasses = classnames.bind(styles)

/**
 * Component to render page navigation options
 */

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
        icon="MdFirstPage"
        label={intl.formatMessage(messages.first)}
      />
      <IndexButton
        modifier="left"
        disabled={!canPreviousPage}
        action={() => previousPage()}
        icon="MdChevronLeft"
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
        icon="MdChevronRight"
        label={intl.formatMessage(messages.next)}
      />
      <IndexButton
        modifier="right"
        disabled={!canNextPage}
        action={() => gotoPage(pageCount - 1)}
        icon="MdLastPage"
        label={intl.formatMessage(messages.last)}
      />
    </div>
  )
}

PageIndexSelectors.propTypes = {
  /**
    Boolean to allow next page
  */
  canNextPage: bool.isRequired,
  /**
    Boolean to allow previous page
  */
  canPreviousPage: bool.isRequired,
  /**
    Length of data to be rendered, needed for calcs
  */
  dataLength: number.isRequired,
  /**
    Function to navigate to page provided as int
  */
  gotoPage: func.isRequired,
  /**
    Name of the type of records
  */
  name: string.isRequired,
  /**
    Function to move to immediate next page
  */
  nextPage: func.isRequired,
  /**
    Current page index (starts at zero)
  */
  pageIndex: number.isRequired,
  /**
    Total rows shown per page
  */
  pageSize: number.isRequired,
  /**
    Total pages calculated from rows and page size
  */
  pageCount: number.isRequired,
  /**
    Function to navigate to the immediate previous page
  */
  previousPage: func.isRequired,
}

export default PageIndexSelectors
