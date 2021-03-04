import classnames from 'classnames/bind'
import React, { useState, useEffect } from 'react'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import isEditable from '../../shared/selectors/isEditable'
import AspectCheckbox from '../../components/shared/AspectCheckbox'
import { formatRelative } from '../../shared/utils/dateFormat'
import { useAuthState } from '../../Providers/AuthProvider'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const ReporterTableRow = ({ intl, reporter, onRevokedItem, ...restProps }) => {
  const [disabled, setDisabled] = useState({})
  const user = useAuthState()

  const onRevokedChange = ({ target }, revoked) => {
    onRevokedItem({ id: target.dataset.id, revoked })
  }

  useEffect(() => {
    setDisabled(!isEditable(user, 'reporter'))
  }, [user])

  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{reporter.get('user')}</TableCell>
      <TableCell>{reporter.get('deviceName')}</TableCell>
      <TableCell>{formatRelative(intl, reporter.get('createdOn'))}</TableCell>
      <TableCell>{formatRelative(intl, reporter.get('lastSeen'))}</TableCell>
      <TableCell>{intl.formatNumber(reporter.get('delivered'))}</TableCell>
      <TableCell>
        {intl.formatNumber(reporter.get('requiresFollowUp'))}
      </TableCell>
      <TableCell>
        {intl.formatNumber(reporter.get('confirmFollowUpRatio'), {
          style: 'percent',
        })}
      </TableCell>
      <TableCell>
        {intl.formatNumber(reporter.get('acknowledgedRatio'), {
          style: 'percent',
        })}
      </TableCell>
      <TableCell
        style={{
          color: reporter.get('confirmFollowUpRatio') === 1 ? '' : 'red',
        }}
      >
        {intl.formatNumber(reporter.get('totalOnTreatment'))}/
        {intl.formatNumber(reporter.get('requiresFollowUp'))}
      </TableCell>
      <TableCell>
        <AspectCheckbox
          name="revoked"
          className={cssClasses('Checkbox__field')}
          inputProps={{
            'data-id': reporter.get('id'),
          }}
          disabled={disabled}
          checked={reporter.get('revoked')}
          onChange={onRevokedChange}
        />
      </TableCell>
    </TableRow>
  )
}

export default ReporterTableRow
