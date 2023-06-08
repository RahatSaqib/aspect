import React from 'react'
import { Button } from '@mui/material'
import classnames from 'classnames/bind'
import min from 'lodash/min'
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaAngleLeft, FaAngleRight } from 'react-icons/fa'
import useI18n from '../../hooks/useI18n'
import messages from './messages'
import styles from './styles.css'

const cssClasses = classnames.bind(styles)

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
  const { formatMessage } = useI18n()
  const hasFirstPage = pageAt !== 0
  const hasPreviousPage = pageAt > 0
  const firstItemIndex = 1 + pageSize * pageAt
  const lastItemIndex = min([total, pageSize * (1 + pageAt)])
  const hasNextPage = total > pageSize * (1 + pageAt)
  const hasLastPage = total > pageSize * (1 + pageAt)

  return (
    <div className={cssClasses(className, 'Container')}>
      <div className={cssClasses('Left')}>
        <SimpleTablePaginationButton
          classes={{ root: cssClasses('Left__Button') }}
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
          classes={{ root: cssClasses('Left__Button') }}
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
        <div className={cssClasses('Left__Status')}>
          {formatMessage(paginatorStatus, { firstItemIndex, lastItemIndex, itemCount: total })}
        </div>
        <SimpleTablePaginationButton
          classes={{ root: cssClasses('Left__Button', 'Left__Button--next') }}
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
          classes={{ root: cssClasses('Left__Button', 'Left__Button--next') }}
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
      <div className={cssClasses('Right')}>
        <SimpleTablePaginationButton
          classes={{ root: cssClasses('Right__Button') }}
          className={cssClasses({ selected: pageSize === 10 })}
          onClick={() => onPageSizeChange(10)}
          label={`${10}`}
        />
        <SimpleTablePaginationButton
          classes={{ root: cssClasses('Right__Button') }}
          className={cssClasses({ selected: pageSize === 25 })}
          onClick={() => onPageSizeChange(25)}
          label={`${25}`}
        />
        <SimpleTablePaginationButton
          classes={{ root: cssClasses('Right__Button') }}
          className={cssClasses({ selected: pageSize === 50 })}
          onClick={() => onPageSizeChange(50)}
          label={`${50}`}
        />
        <SimpleTablePaginationButton
          classes={{ root: cssClasses('Right__Button') }}
          className={cssClasses({ selected: pageSize === 100 })}
          onClick={() => onPageSizeChange(100)}
          label={`${100}`}
        />
        <SimpleTablePaginationButton
          classes={{ root: cssClasses('Right__Button') }}
          className={cssClasses({ selected: pageSize === total })}
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
