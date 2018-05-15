import classnames from 'classnames/bind'
import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { Button } from 'react-toolbox/lib/button'
import { Input } from 'react-toolbox/lib/input'
import { compose, lifecycle, pure, withHandlers } from 'recompose'

import { shortNumericDate } from '../../../shared/utils/dateFormat'
import recomposeForm from '../../../components/recomposeForm'
import { acknowledgeIssue } from '../../../issue/IssueRedux'
import { updateStockLevel } from '../../../inventory/InventoryRedux'
import { showAcknowledgement } from '../../../appNotification/AppNotificationRedux'

const cssClasses = classnames.bind(require('./ActionTableRow.css'))

const themes = {
  Input: {
    input: cssClasses('Form__Input'),
    inputElement: cssClasses('Form_InputElement'),
  },
}

const UpdateStockLevelInput = compose(
  pure,
  connect(
    null,
    bindActionCreators.bind(null, { updateStockLevel, showAcknowledgement })
  ),
  lifecycle({
    componentWillMount() {
      const onChange = values => this.setState({ values })
      const { action } = this.props

      this.setState({
        onChange,
        values: {
          quantity: action.get('totalInStock', 0),
        },
      })
    },

    componentWillReceiveProps(nextProps) {
      const { action } = nextProps
      if (this.props.action === action) {
        return
      }
      this.state.onChange({
        quantity: action.get('totalInStock', 0),
      })
    },
  }),
  withHandlers({
    onSubmit: ({
      action,
      messages,
      updateStockLevel,
      showAcknowledgement,
    }) => values =>
      updateStockLevel(
        action.get('siteId'),
        action.get('consumableId'),
        values
      ).then(() => {
        showAcknowledgement({
          title: messages.stockLevelUpdatedSuccessfully,
        })
      }),
  }),
  recomposeForm({
    fields: [
      {
        fieldName: 'quantity',
        valueFromChangeEvent: value => {
          if (/^\d+\.?\d*$/.test(value)) {
            return parseInt(value, 10)
          }
          return 0
        },
      },
    ],
    validate() {
      const errors = {}
      return errors
    },
  })
)(
  ({
    intl,
    messages,
    forceEdit = false,
    form,
    values,
    onQuantityChange,
    handleSubmit,
  }) => (
    <div className={cssClasses('Issue__Action__Status--withInput')}>
      <span className={cssClasses('Issue__Action__Input__Container')}>
        <span className={cssClasses('Issue__Action__Input__Label')}>
          {intl.formatMessage(
            forceEdit ? messages.updateStockLevel : messages.stockLevel
          )}
        </span>
        <Input
          type="text"
          name="quantity"
          value={values.quantity}
          onChange={onQuantityChange}
          theme={themes.Input}
        />
        <Button
          inverse
          disabled={form.pristine || !form.valid || form.submitting}
          className={cssClasses('Button__Acknowledge')}
          label={intl.formatMessage(messages.update)}
          onClick={handleSubmit}
        />
      </span>
    </div>
  )
)
export const ActionStatus = compose(
  pure,
  connect(
    null,
    bindActionCreators.bind(null, { acknowledgeIssue, showAcknowledgement })
  ),
  withHandlers({
    onSubmit: ({
      action,
      messages,
      acknowledgeIssue,
      showAcknowledgement,
    }) => () =>
      acknowledgeIssue(action.get('issueId')).then(() => {
        showAcknowledgement({
          title: messages.issueAcknowledgedSuccessfully,
        })
      }),
  }),
  recomposeForm({
    fields: [],
    validate() {
      const errors = {}
      return errors
    },
  })
)(({ intl, messages, action, handleSubmit }) => {
  if (
    action.get('notificationType') === 'luStockLevelUpdate' ||
    action.get('notificationType') === 'roStockLevelUpdate' ||
    action.get('notificationType') === 'luStockLevelUpdateRoView'
  ) {
    return (
      <UpdateStockLevelInput
        intl={intl}
        messages={messages}
        action={action}
        forceEdit={
          action.get('notificationType') === 'luStockLevelUpdate' &&
          action.get('status') === 'Active'
        }
      />
    )
  }
  if (action.get('status') === 'Active') {
    return (
      <div className={cssClasses('Issue__Action__Status')}>
        {action.get('canAcknowledge') === 1 && (
          <Button
            inverse
            className={cssClasses('Button__Acknowledge')}
            label={intl.formatMessage(messages.acknowledge)}
            onClick={handleSubmit}
          />
        )}
      </div>
    )
  }

  if (action.get('status') === 'Acknowledged') {
    return (
      <div className={cssClasses('Issue__Action__Status')}>
        <span>
          {`${intl.formatMessage(messages.acknowledged)}
     ${intl.formatDate(action.get('statusDate'), shortNumericDate)}`}
        </span>
      </div>
    )
  }
})

export default ActionStatus
