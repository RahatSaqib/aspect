import React from 'react'
import { Button } from '@mui/material'
import min from 'lodash/min'
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaAngleLeft, FaAngleRight } from 'react-icons/fa'
import { useIntl } from 'react-intl'
import messages from '../../messages/allMessages'
import styles from './styles.module.css'

const SimpleTablePagination = ({
  timedMessageUsed = false,
  paginatorStatus,
  className,
  total,
  pageSize,
  pageAt,
  onPageChange,
  onPageSizeChange,
}) => {
  const { formatMessage } = useIntl()
  const hasFirstPage = pageAt !== 0
  const hasPreviousPage = pageAt > 0
  const firstItemIndex = 1 + pageSize * pageAt
  const lastItemIndex = min([total, pageSize * (1 + pageAt)])
  const hasNextPage = total > pageSize * (1 + pageAt)
  const hasLastPage = total > pageSize * (1 + pageAt)

  return (
    <div className={`${styles[className]} Container`}>
      <div className={styles.Left}>
        <SimpleTablePaginationButton
          classes={{ root: styles.Left__Button }}
          disabled={!hasFirstPage}
          variant="outlined"
          onClick={() => onPageChange(0)}
          label={
            <>
              <FaAngleDoubleLeft />
              {formatMessage(messages.first)}
            </>
          }
        />
        <SimpleTablePaginationButton
          classes={{ root: styles.Left__Button }}
          disabled={!hasPreviousPage}
          variant="outlined"
          onClick={() => onPageChange(pageAt - 1)}
          label={
            <>
              <FaAngleLeft />
              {formatMessage(timedMessageUsed ? messages.newer : messages.previous)}
            </>
          }
        />
        <div className={styles.Left__Status}>
          {formatMessage(paginatorStatus, { firstItemIndex, lastItemIndex, itemCount: total })}
        </div>
        <SimpleTablePaginationButton
          classes={{ root: 'Left__Button Left__Button__next' }}
          disabled={!hasNextPage}
          variant="outlined"
          onClick={() => onPageChange(pageAt + 1)}
          label={
            <>
              {formatMessage(timedMessageUsed ? messages.older : messages.next)}
              <FaAngleRight />
            </>
          }
        />
        <SimpleTablePaginationButton
          classes={{ root: 'Left__Button Left__Button__next' }}
          disabled={!hasLastPage}
          variant="outlined"
          onClick={() => {
            const lastPage = total % pageSize === 0 ? total / pageSize - 1 : total / pageSize
            onPageChange(Math.floor(lastPage))
          }}
          label={
            <>
              {formatMessage(messages.last)}
              <FaAngleDoubleRight />
            </>
          }
        />
      </div>
      <div className={styles.Right}>
        <SimpleTablePaginationButton
          classes={{ root: styles.Right__Button }}
          className={pageSize === 10 ? styles.selected : ''}
          onClick={() => onPageSizeChange(10)}
          label={`${10}`}
        />
        <SimpleTablePaginationButton
          classes={{ root: styles.Right__Button }}
          className={pageSize === 25 ? styles.selected : ''}
          onClick={() => onPageSizeChange(25)}
          label={`${25}`}
        />
        <SimpleTablePaginationButton
          classes={{ root: styles.Right__Button }}
          className={pageSize === 50 ? styles.selected : ''}
          onClick={() => onPageSizeChange(50)}
          label={`${50}`}
        />
        <SimpleTablePaginationButton
          classes={{ root: styles.Right__Button }}
          className={pageSize === 100 ? styles.selected : ''}
          onClick={() => onPageSizeChange(100)}
          label={`${100}`}
        />
        <SimpleTablePaginationButton
          classes={{ root: styles.Right__Button }}
          className={pageSize === total ? styles.selected : ''}
          onClick={() => onPageSizeChange(total)}
          label={formatMessage(messages.all)}
        />
      </div>
    </div>
  )
}

export default SimpleTablePagination

const SimpleTablePaginationButton = ({ label, ...otherProps }) => {
  return (
    <Button variant="contained" color="primary" {...otherProps}>
      {label}
    </Button>
  )
}
