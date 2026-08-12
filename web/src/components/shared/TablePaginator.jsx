import React from 'react'
import { Button } from '@mui/material'
import min from 'lodash/min'
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaAngleLeft, FaAngleRight } from 'react-icons/fa'
import { defineMessages, useIntl } from 'react-intl'
import styles from './TablePaginator.module.css'

export const ALL_KEY = 'All'

export const PAGE_SIZE_BUTTON_KEYS = [10, 25, 50, 100, ALL_KEY]

const messages = defineMessages({
  all: {
    id: 'pages.TablePaginator.all',
    defaultMessage: 'All',
  },
  first: {
    id: 'pages.TablePaginator.first',
    defaultMessage: 'First',
  },
  previous: {
    id: 'pages.TablePaginator.previous',
    defaultMessage: 'Previous',
  },
  newer: {
    id: 'pages.TablePaginator.newer',
    defaultMessage: 'Newer',
  },
  older: {
    id: 'pages.TablePaginator.older',
    defaultMessage: 'Older',
  },
  next: {
    id: 'pages.TablePaginator.next',
    defaultMessage: 'Next',
  },
  last: {
    id: 'pages.TablePaginator.last',
    defaultMessage: 'Last',
  },
})

const TablePaginator = ({
  timedMessageUsed = false,
  paginatorStatus,
  paginatorStatusLoading,
  className,
  pageAt,
  pageSize,
  total,
  totalLoading,
  hasNextPageFromItems,
  onPageChange,
  onPageSizeChange,
  pageSizeButtonKeys = PAGE_SIZE_BUTTON_KEYS,
}) => {
  const { formatMessage } = useIntl()

  // While the total is loading, pagination relies on the items themselves
  const effectiveTotal = totalLoading ? undefined : total
  const hasNextPage = totalLoading
    ? hasNextPageFromItems ?? false
    : effectiveTotal
    ? effectiveTotal > pageSize * (1 + pageAt)
    : false
  const hasLastPage = totalLoading ? false : hasNextPage
  const hasFirstPage = pageAt !== 0
  const hasPreviousPage = pageAt > 0
  const firstItemIndex = 1 + pageSize * pageAt
  const lastItemIndex = effectiveTotal ? min([effectiveTotal, pageSize * (1 + pageAt)]) : pageSize * (1 + pageAt)

  const onFirstClick = () => onPageChange(0)
  const onPreviousClick = () => onPageChange(pageAt - 1)
  const onNextClick = () => onPageChange(pageAt + 1)
  const onLastClick = () => {
    const totalToUse = effectiveTotal || total
    if (!totalToUse) return
    const lastPage = totalToUse % pageSize === 0 ? totalToUse / pageSize - 1 : totalToUse / pageSize
    onPageChange(Math.floor(lastPage))
  }
  const onPageSizeButtonClick = key => () => onPageSizeChange(key === ALL_KEY ? effectiveTotal || total || 'all' : key)

  const statusMessage = totalLoading && paginatorStatusLoading ? paginatorStatusLoading : paginatorStatus
  const statusValues = totalLoading
    ? { firstItemIndex, lastItemIndex }
    : { firstItemIndex, lastItemIndex, itemCount: effectiveTotal }

  return (
    <div className={`${styles[className]} ${styles.Container}`}>
      <div className={styles.Left}>
        <Button
          classes={{
            root: styles.Left__Button,
          }}
          disabled={!hasFirstPage}
          color="primary"
          variant="outlined"
          onClick={onFirstClick}
        >
          <FaAngleDoubleLeft />
          {formatMessage(messages.first)}
        </Button>
        <Button
          classes={{
            root: styles.Left__Button,
          }}
          disabled={!hasPreviousPage}
          color="primary"
          variant="outlined"
          onClick={onPreviousClick}
        >
          <FaAngleLeft />
          {formatMessage(timedMessageUsed ? messages.newer : messages.previous)}
        </Button>
        <div className={styles.Left__Status}>{formatMessage(statusMessage, statusValues)}</div>
        <Button
          classes={{
            root: [styles.Left__Button],
          }}
          disabled={!hasNextPage}
          color="primary"
          variant="outlined"
          onClick={onNextClick}
        >
          {formatMessage(timedMessageUsed ? messages.older : messages.next)}
          <FaAngleRight />
        </Button>
        <Button
          classes={{
            root: [styles.Left__Button],
          }}
          disabled={!hasLastPage}
          color="primary"
          variant="outlined"
          onClick={onLastClick}
        >
          {formatMessage(messages.last)}
          <FaAngleDoubleRight />
        </Button>
      </div>
      <div className={styles.Right}>
        {pageSizeButtonKeys.map(key => (
          <Button
            key={key}
            classes={{
              root: styles.Right__Button,
            }}
            className={`${(key !== ALL_KEY ? key === pageSize : pageSize === total) ? 'selected' : ''}`}
            onClick={onPageSizeButtonClick(key)}
            variant="contained"
            color="primary"
          >
            {key !== ALL_KEY ? `${key}` : formatMessage(messages.all)}
          </Button>
        ))}
      </div>
    </div>
  )
}

export default React.memo(TablePaginator)
