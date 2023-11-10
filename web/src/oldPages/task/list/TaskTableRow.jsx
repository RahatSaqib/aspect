import React from 'react'
import { FaExclamationTriangle } from 'react-icons/fa'
import AlertType from '../../../oldComponents/shared/AlertType'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'
import ColoredButton from '../../../oldComponents/themedReactToolbox/ColoredButton'
import { formatRelative } from '../../../utils/utils/dateFormat'
import { useIntl } from 'react-intl'
import styles from './TaskTableRow.module.css'

const TaskTableRow = ({ messages, task, ...restProps }) => {
  const intl = useIntl()
  const { formatMessage, formatRelativeTime } = intl
  return (
    <TableRow {...restProps} className={`${styles[restProps.className]} ${styles.TableRow}`}>
      <TableCell className={styles.TableCell}>
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
      <TableCell className={styles.TableCell}>
        <div className={styles.Message}>
          <ColoredButton
            className={styles.ColoredButton}
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
          <span className={styles.Message__Subject}>{addEllipsis(task.get('title'))}</span>
          <span className={styles.Message__Text}>{task.get('message')}</span>
          {messages.alertCount && task.get('issueCount') > 1 && (
            <span className={styles.Message__Alert}>
              <FaExclamationTriangle className={styles.FaExclamationTriangle} />
              {intl.formatMessage(messages.alertCount, {
                alertCount: task.get('issueCount'),
              })}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className={styles.TableCell}>{addEllipsis(task.get('site'))}</TableCell>
      <TableCell className={styles.TableCell}>{formatRelative(task.get('time'), formatRelativeTime)}</TableCell>
    </TableRow>
  )
}
function addEllipsis(words) {
  const wordsArray = words.split(',')
  if (wordsArray.length > 2) return `${wordsArray[0]}, ${wordsArray[1]} ...`
  return words
}

export default TaskTableRow
