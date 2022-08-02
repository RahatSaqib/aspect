import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import { FaExclamationTriangle } from 'react-icons/fa'
import { useIntl } from 'react-intl'
import ColoredButton from '../../components/themedReactToolbox/ColoredButton'
import AlertType from '../../components/shared/AlertType'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../components/shared/tableBody'
import { formatRelative } from '../../shared/utils/dateFormat'

import styles from './TaskTableRow.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

const TaskTableRow = ({ messages, task, ...restProps }) => {
  const intl = useIntl()
  const { formatMessage } = intl
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className, 'TableRow')}>
      <TableCell className={cssClasses('TableCell')}>
        <AlertType
          alertType={
            messages[task.get('issueStatusI18nKey')]
              ? formatMessage(messages[task.get('issueStatusI18nKey')])
              : messages[task.get('issueCategoryExternalId')]
              ? formatMessage(messages[task.get('issueCategoryExternalId')])
              : task.get('issueStatus')
          }
        />
      </TableCell>
      <TableCell className={cssClasses('TableCell')}>
        <div className={cssClasses('Message')}>
          <ColoredButton
            className={cssClasses('ColoredButton')}
            shipCove={task.get('issueCategoryExternalId').toString().toLowerCase() === 'devicehealth'}
            shakespeare={task.get('issueCategoryExternalId').toString().toLowerCase() === 'reagenthealth'}
            mountain={task.get('issueCategoryExternalId').toString().toLowerCase() === 'datahealth'}
            brink={task.get('issueCategoryExternalId').toString().toLowerCase() === 'connectivityhealth'}
            label={
              task.get('issueCategoryI18nKey')
                ? formatMessage(messages[task.get('issueCategoryI18nKey')])
                : formatMessage(messages[task.get('issueCategoryExternalId')])
            }
          />
          <span className={cssClasses('Message__Subject')}>{addEllipsis(task.get('title'))}</span>
          <span className={cssClasses('Message__Text')}>{task.get('message')}</span>
          {messages.alertCount && task.get('issueCount') > 1 && (
            <span className={cssClasses('Message__Alert')}>
              <FaExclamationTriangle className={cssClasses('FaExclamationTriangle')} />
              {intl.formatMessage(messages.alertCount, {
                alertCount: task.get('issueCount'),
              })}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className={cssClasses('TableCell')}>{addEllipsis(task.get('site'))}</TableCell>
      <TableCell className={cssClasses('TableCell')}>{formatRelative(task.get('time'))}</TableCell>
    </TableRow>
  )
}
function addEllipsis(words) {
  const wordsArray = words.split(',')
  if (wordsArray.length > 2) return `${wordsArray[0]}, ${wordsArray[1]} ...`
  return words
}

export default enhance(TaskTableRow)
