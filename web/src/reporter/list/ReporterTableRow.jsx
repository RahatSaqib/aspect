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
      <TableCell>{intl.formatRelative(reporter.get('createdOn'))}</TableCell>
      <TableCell>{intl.formatRelative(reporter.get('lastSeen'))}</TableCell>
      <TableCell>
        {intl.formatNumber(reporter.get('deliveredLastMonth'))}
      </TableCell>
      <TableCell>
        {intl.formatNumber(reporter.get('deliveredThisMonth'))}
      </TableCell>
      <TableCell>
        {intl.formatNumber(reporter.get('acknowledgedRatio'), {
          style: 'percent',
        })}
      </TableCell>
      <TableCell>{intl.formatNumber(reporter.get('totalFlagged'))}</TableCell>
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

export default connect(
  mapStateToProps,
  { updateSingleReporter }
)(ReporterTableRow)
