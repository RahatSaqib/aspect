import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import FaCircle from 'react-icons/lib/fa/circle'
import { TableRow, TableCell } from 'react-toolbox/lib/table'
import { Button } from 'react-toolbox/lib/button'
import ArrowLeft from 'react-icons/lib/ti/arrow-right'
import { shortNumericDate } from '../../../shared/utils/dateFormat'

const cssClasses = classnames.bind(require('./ActionTableRow.css'))

const enhance = _.identity

const ActionTableRow = ({ intl, messages, action, ...restProps }) => (
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell', 'TableCell--actionType')}>
      <FaCircle
        className={cssClasses(
          `ActionType--${_.lowerCase(action.get('status'))}`
        )}
      />
    </TableCell>
    <TableCell className={cssClasses('TableCell', 'TableCell--site')}>
      {action.get('site')}
    </TableCell>
    <TableCell className={cssClasses('TableCell', 'TableCell--issue')}>
      {action.get('issue')}
    </TableCell>
    <TableCell className={cssClasses('TableCell', 'TableCell--acknowledged')}>
      {action.get('status') === 'Active' && (
        <Button
          className={cssClasses('Button__Acknowledge')}
          label={intl.formatMessage(messages.Acknowledge)}
        />
      )}
      {action.get('status') === 'Acknowledged' && (
        <div>
          {intl.formatMessage(messages.Acknowledged)}
          <br />

          {intl.formatDate(
            action.get('acknowledgedOn', new Date()),
            shortNumericDate
          )}
        </div>
      )}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      <Button className={cssClasses('Button__Link')}>
        <ArrowLeft className={cssClasses('ArrowLeft')} />
      </Button>
    </TableCell>
  </TableRow>
)

export default enhance(ActionTableRow)
