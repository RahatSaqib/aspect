import classnames from 'classnames/bind'
import React from 'react'
import { compose, withHandlers, lifecycle, pure } from 'recompose'
import { defineMessages } from 'react-intl'
import { Card, CardTitle, CardText } from 'react-toolbox/lib/card'

import TablePaginator from '../../components/shared/TablePaginator'
import DataTableProgressBar from '../../components/shared/DataTableProgressBar'
import {
  WorkflowLogDataTable,
  WorkflowLogDataTableHead,
  WorkflowLogDataTableRow,
} from './WorkflowLogDataTable'

const cssClasses = classnames.bind(require('./WorkflowLog.css'))

const messages = defineMessages({
  totalWorkflowStatusLog: {
    id: 'pages.ResultWorkflowStatusLog.totalWorkflowStatusLog',
    defaultMessage: `Result Workflow Status Log {itemCount, plural,
      =0 {}
      other {({itemCount})}
    }`,
  },
  noWorkflowStatusLog: {
    id: 'pages.ResultWorkflowStatusLog.noWorkflowStatusLog',
    defaultMessage: 'No logs for this result.',
  },
  logChangedOn: {
    id: 'pages.ResultWorkflowStatusLog.logChangedOn',
    defaultMessage: 'Changed On',
  },
  logStatus: {
    id: 'pages.ResultWorkflowStatusLog.logStatus',
    defaultMessage: 'Status',
  },
  logOperator: {
    id: 'pages.ResultWorkflowStatusLog.logOperator',
    defaultMessage: 'Operator',
  },
  logPaginatorStatus: {
    id: 'pages.ResultWorkflowStatusLog.paginatorStatus',
    defaultMessage: `Showing {firstItemIndex}-{lastItemIndex} of {itemCount, plural,
      one {# log}
      other {# logs}
    }`,
  },
})

const enhance = compose(
  pure,
  withHandlers({
    onHeadColumnClick: ({ onFetch, table }) => ({
      currentTarget: { dataset: { column: nextSortCol } },
    }) =>
      onFetch(
        nextSortCol,
        table.sortCol === nextSortCol
          ? table.sortDir === 'asc' ? 'desc' : 'asc'
          : table.sortDir,
        0,
        table.pageSize
      ),
    onPageChange: ({ onFetch, table }) => nextPage =>
      onFetch(table.sortCol, table.sortDir, nextPage, table.pageSize),
    onPageSizeChange: ({ onFetch, table }) => nextPageSize =>
      onFetch(table.sortCol, table.sortDir, 0, nextPageSize),
  }),
  lifecycle({
    componentDidMount() {
      this.props.onPageChange(0)
    },
  })
)

export const ResultWorkflowStatusLog = ({
  intl,
  table,
  items,
  //
  onHeadColumnClick,
  onPageChange,
  onPageSizeChange,
}) => (
  <Card>
    <CardTitle
      title={intl.formatMessage(messages.totalWorkflowStatusLog, {
        itemCount: table.total,
      })}
    />
    {items.currentIdList.isEmpty() && (
      <CardText className={cssClasses('CardText')}>
        {intl.formatMessage(messages.noWorkflowStatusLog)}
      </CardText>
    )}
    {!items.currentIdList.isEmpty() && (
      <CardText>
        <DataTableProgressBar disabled={!table.loading} />
        <WorkflowLogDataTable
          selectable={false}
          className={cssClasses('WorkflowLogDataTable')}
        >
          <WorkflowLogDataTableHead
            sortColumnKey={table.sortCol}
            sortColumnDir={table.sortDir}
            columns={[
              {
                key: 'changedOn',
                label: intl.formatMessage(messages.logChangedOn),
                onClick: onHeadColumnClick,
              },
              {
                key: 'statusName',
                label: intl.formatMessage(messages.logStatus),
                onClick: onHeadColumnClick,
              },
              {
                key: 'operator',
                label: intl.formatMessage(messages.logOperator),
                onClick: onHeadColumnClick,
              },
            ]}
          />
          {items.currentIdList
            .map(id => items.byId.get(id))
            .map(workflowLog => (
              <WorkflowLogDataTableRow
                key={workflowLog.get('id')}
                intl={intl}
                workflowLog={workflowLog}
              />
            ))}
        </WorkflowLogDataTable>
        <TablePaginator
          className={cssClasses('TablePaginator')}
          intl={intl}
          paginatorStatus={messages.logPaginatorStatus}
          pageAt={table.page}
          pageSize={table.pageSize}
          total={table.total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      </CardText>
    )}
  </Card>
)

export default enhance(ResultWorkflowStatusLog)
