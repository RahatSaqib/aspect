import PropTypes from 'prop-types'
// Imports from packages
import React, { PureComponent } from 'react'
import { defineMessages, intlShape } from 'react-intl'

// Material-UI
import Paper from 'material-ui/Paper'
import { Card, CardHeader, CardText } from 'material-ui/Card'

// Our own imports
import DataTable from '../../components/shared/DataTable'
import { WorkflowLogModel } from '../ResultRedux'

const messages = defineMessages({
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
  noWorkflowStatusLog: {
    id: 'pages.ResultWorkflowStatusLog.noWorkflowStatusLog',
    defaultMessage: 'No logs for this result.',
  },
})

export default class ResultWorkflowStatusLog extends PureComponent {
  static propTypes = {
    intl: intlShape.isRequired,
    handleFetch: PropTypes.func.isRequired,
    workflowLog: PropTypes.objectOf(WorkflowLogModel).isRequired,
  }

  handleFetch = (...args) => {
    this.props.handleFetch(...args)
  }

  render() {
    const { workflowLog, intl } = this.props
    const { formatMessage, formatDate } = intl
    const columns = [
      {
        db: 'changedOn',
        title: formatMessage(messages.logChangedOn),
        format: data => formatDate(data),
      },
      { db: 'statusName', title: formatMessage(messages.logStatus) },
      { db: 'operator', title: formatMessage(messages.logOperator) },
    ]
    const items = workflowLog.items
    const table = workflowLog.table

    const totals = table.total > 0 ? `(${table.total})` : ''
    const title = `Result Workflow Status Log ${totals}`

    return (
      <div>
        <Card>
          <CardHeader title={title} actAsExpander showExpandableButton />
          <CardText expandable style={{ paddingTop: 0 }}>
            {!table.loading && items.currentIdList.isEmpty()
              ? <Paper style={{ textAlign: 'center', padding: 10 }}>
                  <p>{intl.formatMessage(messages.noWorkflowStatusLog)}</p>
                </Paper>
              : <DataTable
                  items={items}
                  table={table}
                  columns={columns}
                  intl={intl}
                  messages={messages}
                  handleFetch={this.handleFetch}
                />}
          </CardText>
        </Card>
      </div>
    )
  }
}
