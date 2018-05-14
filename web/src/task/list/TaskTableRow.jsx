import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'
import FaExclamationTriangle from 'react-icons/lib/fa/exclamation-triangle'
import MdModeComment from 'react-icons/lib/md/mode-comment'
import ColoredButton from '../../components/themedReactToolbox/ColoredButton'
import AlertType from '../../components/shared/AlertType'

const cssClasses = classnames.bind(require('./TaskTableRow.css'))

const enhance = _.identity

const TaskTableRow = ({ intl, messages, task, ...restProps }) => (
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      <AlertType alertType={task.get('alertType')} />
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      <div className={cssClasses('Message')}>
        <ColoredButton
          className={cssClasses('ColoredButton')}
          shipCove={task.get('topic') === 'health'}
          shakespeare={task.get('topic') === 'device'}
          mountain={task.get('topic') === 'consumable'}
          brink={task.get('topic') === 'site'}
          label={task.get('topic')}
        />
        <span className={cssClasses('Message__Subject')}>
          {task.get('title')}
        </span>
        <span className={cssClasses('Message__Text')}>
          {task.get('message')}
        </span>
        {task.get('alertCount') > 0 && (
          <span className={cssClasses('Message__Alert')}>
            <FaExclamationTriangle
              className={cssClasses('FaExclamationTriangle')}
            />
            {intl.formatMessage(messages.alertCount, {
              alertCount: task.get('alertCount'),
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
    <TableCell
      className={cssClasses('TableCell', 'TableCell--notificationCount')}
    >
      {task.get('notificationCount') > 0 && (
        <MdModeComment className={cssClasses('MdModeComment')} />
      )}
      {task.get('notificationCount') > 0 && (
        <span className={cssClasses('NotificationCount')}>
          {task.get('notificationCount')}
        </span>
      )}
      {task.get('notificationCount') === 0 && '…'}
    </TableCell>
  </TableRow>
)

export default enhance(TaskTableRow)
