import classnames from 'classnames/bind'
import React from 'react'
import { connect } from 'react-redux'

import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import isEditable from '../../shared/selectors/isEditable'
import AspectCheckbox from '../../components/shared/AspectCheckbox'
import { updateSingleReporter } from '../ReporterRedux'
import { formatRelative } from '../../shared/utils/dateFormat'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const ReporterTableRow = ({
  intl,
  reporter,
  updateSingleReporter,
  disabled,
  ...restProps
}) => {
  const onRevokedChange = ({ target }, revoked) => {
    updateSingleReporter(target.dataset.id, { revoked })
  }
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

const mapStateToProps = state => ({
  disabled: !isEditable(state.user, 'reporter'),
})

export default connect(mapStateToProps, { updateSingleReporter })(
  ReporterTableRow
)
