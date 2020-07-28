import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import { FaCircle, FaArrowRight } from 'react-icons/fa'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../../components/shared/tableBody'
import AspectButton from '../../../components/shared/AspectButton'
import requirePermissions from '../../../components/shared/requirePermissions'
import ActionStatus from './ActionStatus'

const cssClasses = classnames.bind(require('./ActionTableRow.css'))

const enhance = _.identity

const ActionLinkButton = requirePermissions({
  permissions: [
    'browse:view',
    'device:view',
    'result:view',
    'person:view',
    'site:view',
    'inventory:view',
    'router:view',
    'reporter:view',
    'notification:view',
    'report:view',
    'deviceApiKey:view',
  ],
})(AspectButton)

const ActionTableRow = ({
  intl,
  messages,
  action,
  onActionListClick,
  sortingProps,
  ...restProps
}) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell className={cssClasses('TableCell', 'TableCell--actionType')}>
      <FaCircle
        className={cssClasses(
          `ActionType--${_.lowerCase(
            action.get('issueStatusSeverityExternalId')
          )}`
        )}
      />
    </TableCell>
    <TableCell className={cssClasses('TableCell', 'TableCell--site')}>
      {action.get('siteName')}
    </TableCell>
    <TableCell className={cssClasses('TableCell', 'TableCell--device')}>
      {action.get('deviceName')}
    </TableCell>
    <TableCell className={cssClasses('TableCell', 'TableCell--issue')}>
      <div className={cssClasses('Issue')}>
        <span className={cssClasses('Issue__Message')}>
          {action.get('message')}
        </span>
        <div className={cssClasses('Issue__Action')}>
          <ActionStatus
            intl={intl}
            messages={messages}
            action={action}
            sortingProps={sortingProps}
          />

          <ActionLinkButton
            inverse
            className={cssClasses('Button__Link')}
            data-site-id={action.get('siteId')}
            data-device-id={action.get('deviceId')}
            data-result-id={action.get('resultId')}
            onClick={onActionListClick}
          >
            <FaArrowRight className={cssClasses('ArrowLeft')} />
          </ActionLinkButton>
        </div>
      </div>
    </TableCell>
  </TableRow>
)

export default enhance(ActionTableRow)
