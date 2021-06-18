import identity from 'lodash/identity'
import classnames from 'classnames/bind'
import React from 'react'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import ColoredButton from '../../components/themedReactToolbox/ColoredButton'
import { messages } from './SiteList'
import { formatRelative } from '../../shared/utils/dateFormat'

import styles from '../../components/shared/DataTableRow.css'

const cssClasses = classnames.bind(styles)

const enhance = identity

const SiteTableRow = ({ intl, site, onAlertClick, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{site.name}</TableCell>
    <TableCell>{site.state}</TableCell>
    <TableCell>{site.lga}</TableCell>
    <TableCell>{site.externalId}</TableCell>
    <TableCell>{site.totalDevices}</TableCell>
    <TableCell>
      {formatRelative(intl, site.inventoryUpdatedOn, 'N/A')}
    </TableCell>
    <TableCell>
      {site.siteIssues &&
        site.siteIssues.map(issue => (
          <ColoredButton
            key={issue}
            className={cssClasses('ColoredButton--micro')}
            label={intl.formatMessage(messages[issue])}
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

export default enhance(SiteTableRow)
