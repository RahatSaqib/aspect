import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { TableRow, TableCell } from 'react-toolbox/lib/table'
import { Button } from 'react-toolbox/lib/button'
import FaBell from 'react-icons/lib/fa/bell'
import FaCircleO from 'react-icons/lib/fa/circle-o'
import FaCircle from 'react-icons/lib/fa/circle'
import FaExclamationTriangle from 'react-icons/lib/fa/exclamation-triangle'
import MdModeComment from 'react-icons/lib/md/mode-comment'

const cssClasses = classnames.bind(require('./TaskTableRow.css'))

const enhance = _.identity

const themes = {
  Button: {
    neutral: cssClasses('Button--neutral'),
    raised: cssClasses('Button--raised'),
  },
}

const TaskTableRow = ({ intl, messages, task, ...restProps }) =>
  <TableRow
    {...restProps}
    className={cssClasses(restProps.className, 'TableRow')}
  >
    <TableCell className={cssClasses('TableCell')}>
      {task.get('alertType') === 'mine' &&
        <FaCircle className={cssClasses('FaCircle')} />}
      {task.get('alertType') === 'normal' &&
        <FaCircleO className={cssClasses('FaCircleO')} />}
      {task.get('alertType') === 'snoozed' &&
        <span className={cssClasses('FaBell')}>
          <FaBell />
        </span>}
    </TableCell>
    <TableCell className={cssClasses('TableCell')}>
      <div className={cssClasses('Message')}>
        <Button
          className={cssClasses('Button', {
            'Button--ship-cove': task.get('topic') === 'health',
            'Button--shakespeare': task.get('topic') === 'device',
            'Button--mountain': task.get('topic') === 'consumable',
            'Button--brink': task.get('topic') === 'site',
          })}
          neutral
          raised
          label={task.get('topic')}
          theme={themes.Button}
        />
        <span className={cssClasses('Message__Subject')}>
          {task.get('title')}
        </span>
        <span className={cssClasses('Message__Text')}>
          {task.get('message')}
        </span>
        {task.get('alertCount') > 0 &&
          <span className={cssClasses('Message__Alert')}>
            <FaExclamationTriangle
              className={cssClasses('FaExclamationTriangle')}
            />
            {intl.formatMessage(messages.alertCount, {
              alertCount: task.get('alertCount'),
            })}
          </span>}
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
      {task.get('notificationCount') > 0 &&
        <MdModeComment className={cssClasses('MdModeComment')} />}
      {task.get('notificationCount') > 0 &&
        <span className={cssClasses('NotificationCount')}>
          {task.get('notificationCount')}
        </span>}
      {task.get('notificationCount') === 0 && '…'}
    </TableCell>
  </TableRow>

export default enhance(TaskTableRow)
