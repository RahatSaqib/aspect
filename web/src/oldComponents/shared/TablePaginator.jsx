import React from 'react'
import { Button } from '@mui/material'
import min from 'lodash/min'
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaAngleLeft, FaAngleRight } from 'react-icons/fa'
import { defineMessages, useIntl } from 'react-intl'
import { compose, withProps, withHandlers, pure } from 'recompose'
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

const enhance = compose(
  withProps(({ pageAt, pageSize, total }) => ({
    hasFirstPage: pageAt !== 0,
    hasPreviousPage: pageAt > 0,
    firstItemIndex: 1 + pageSize * pageAt,
    lastItemIndex: min([total, pageSize * (1 + pageAt)]),
    hasNextPage: total > pageSize * (1 + pageAt),
    hasLastPage: total > pageSize * (1 + pageAt),
  })),
  withHandlers({
    onFirstClick:
      ({ onPageChange }) =>
      () => {
        onPageChange(0)
      },

    onPreviousClick:
      ({ pageAt, onPageChange }) =>
      () => {
        onPageChange(pageAt - 1)
      },

    onNextClick:
      ({ pageAt, onPageChange }) =>
      () => {
        onPageChange(pageAt + 1)
      },

    onLastClick:
      ({ total, pageSize, onPageChange }) =>
      () => {
        const lastPage = total % pageSize === 0 ? total / pageSize - 1 : total / pageSize
        onPageChange(Math.floor(lastPage))
      },

    onPageSizeChange10:
      ({ onPageSizeChange }) =>
      () => {
        onPageSizeChange(10)
      },

    onPageSizeChange25:
      ({ onPageSizeChange }) =>
      () => {
        onPageSizeChange(25)
      },

    onPageSizeChange50:
      ({ onPageSizeChange }) =>
      () => {
        onPageSizeChange(50)
      },

    onPageSizeChange100:
      ({ onPageSizeChange }) =>
      () => {
        onPageSizeChange(100)
      },

    onPageSizeChangeAll:
      ({ onPageSizeChange, total }) =>
      () => {
        onPageSizeChange(total)
      },
  }),
  pure
)

const TablePaginator = ({
  timedMessageUsed = false,
  paginatorStatus,
  className,
  onFirstClick,
  onPreviousClick,
  onNextClick,
  onLastClick,
  hasFirstPage,
  hasPreviousPage,
  firstItemIndex,
  lastItemIndex,
  hasNextPage,
  hasLastPage,
  total,
  pageSize,
  pageSizeButtonKeys = PAGE_SIZE_BUTTON_KEYS,
  ...restProps
}) => {
  const { formatMessage } = useIntl()
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
        <div className={styles.Left__Status}>
          {formatMessage(paginatorStatus, {
            firstItemIndex,
            lastItemIndex,
            itemCount: total,
          })}
        </div>
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
            onClick={restProps[`onPageSizeChange${key}`]}
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

export default enhance(TablePaginator)
