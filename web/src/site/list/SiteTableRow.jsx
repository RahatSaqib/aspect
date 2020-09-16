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

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = identity

const SiteTableRow = ({ intl, site, onAlertClick, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{site.get('name')}</TableCell>
    <TableCell>{site.get('state')}</TableCell>
    <TableCell>{site.get('lga')}</TableCell>
    <TableCell>{site.get('externalId')}</TableCell>
    <TableCell>{site.get('totalDevices')}</TableCell>
    <TableCell>
      {formatRelative(intl, site.get('inventoryUpdatedOn'), 'N/A')}
    </TableCell>
    <TableCell>
      {site.get('siteIssues') &&
        site
          .get('siteIssues')
          .map(issue => (
            <ColoredButton
              key={issue}
              className={cssClasses('ColoredButton--micro')}
              label={intl.formatMessage(messages[issue])}
              shipCove={issue === 'issueCategoryDeviceHealth'}
              shakespeare={issue === 'issueCategoryReagentHealth'}
              brink={issue === 'issueCategoryDataHealth'}
              mountain={issue === 'issueCategoryConnectivityHealth'}
              onClick={onAlertClick}
              data-site-id={site.get('id')}
            />
          ))}
    </TableCell>
  </TableRow>
)

export default enhance(SiteTableRow)
