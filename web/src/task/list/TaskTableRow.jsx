import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import FaExclamationTriangle from 'react-icons/lib/fa/exclamation-triangle'
// import MdModeComment from 'react-icons/lib/md/mode-comment'
import ColoredButton from '../../components/themedReactToolbox/ColoredButton'
import AlertType from '../../components/shared/AlertType'
import { TableRow, TableCell } from '../../components/shared/tableBody'

const cssClasses = classnames.bind(require('./TaskTableRow.css'))

const enhance = _.identity

const TaskTableRow = ({ intl, messages, task, ...restProps }) => (
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      <AlertType alertType={task.get('issueStatus')} />
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      <div className={cssClasses('Message')}>
        <ColoredButton
          className={cssClasses('ColoredButton')}
          shipCove={
            task
              .get('issueCategoryExternalId')
              .toString()
              .toLowerCase() === 'devicehealth'
          }
          shakespeare={
            task
              .get('issueCategoryExternalId')
              .toString()
              .toLowerCase() === 'reagenthealth'
          }
          mountain={
            task
              .get('issueCategoryExternalId')
              .toString()
              .toLowerCase() === 'datahealth'
          }
          brink={
            task
              .get('issueCategoryExternalId')
              .toString()
              .toLowerCase() === 'connectivityhealth'
          }
          label={task.get('issueCategory')}
        />
        <span className={cssClasses('Message__Subject')}>
          {task.get('title')}
        </span>
        <span className={cssClasses('Message__Text')}>
          {task.get('message')}
        </span>
        {messages.alertCount &&
          task.get('issueCount') > 1 && (
            <span className={cssClasses('Message__Alert')}>
              <FaExclamationTriangle
                className={cssClasses('FaExclamationTriangle')}
              />
              {intl.formatMessage(messages.alertCount, {
                alertCount: task.get('issueCount'),
              })}
            </span>
          )}
      </div>
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {task.get('site')}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      {intl.formatRelative(task.get('time'))}
    </TableCell>
  </TableRow>
)

export default enhance(TaskTableRow)
