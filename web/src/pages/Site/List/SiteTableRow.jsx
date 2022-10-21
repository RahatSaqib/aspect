import React from 'react'
import classnames from 'classnames/bind'
import useI18n from '../../../hooks/useI18n'
import styles from '../../../oldComponents/shared/DataTableRow.css'
import { DataTableRow as TableRow, DataTableCell as TableCell } from '../../../oldComponents/shared/tableBody'
import ColoredButton from '../../../oldComponents/themedReactToolbox/ColoredButton'
import { formatRelative } from '../../../utils/utils/dateFormat'
import messages from './messages'

const cssClasses = classnames.bind(styles)

const SiteTableRow = ({ site, onAlertClick, ...restProps }) => {
  const { formatMessage } = useI18n()
  return (
    <TableRow {...restProps} className={cssClasses(restProps.className)}>
      <TableCell>{site.name}</TableCell>
      <TableCell>{site.state}</TableCell>
      <TableCell>{site.lga}</TableCell>
      <TableCell>{site.externalId}</TableCell>
      <TableCell>{site.totalDevices}</TableCell>
      <TableCell>{formatRelative(site.inventoryUpdatedOn, 'N/A')}</TableCell>
      <TableCell>
        {site.siteIssues &&
          site.siteIssues.map(issue => (
            <ColoredButton
              key={issue}
              className={cssClasses('ColoredButton--micro')}
              label={formatMessage(messages[issue])}
              shipCove={issue === 'issueCategoryDeviceHealth'}
              shakespeare={issue === 'issueCategoryReagentHealth'}
              brink={issue === 'issueCategoryDataHealth'}
              mountain={issue === 'issueCategoryConnectivityHealth'}
              onClick={onAlertClick}
              data-site-id={site.id}
            />
          ))}
      </TableCell>
    </TableRow>
  )
}

export default SiteTableRow
