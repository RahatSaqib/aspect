import _ from 'lodash'
import classnames from 'classnames/bind'
import React from 'react'
import {
  DataTableRow as TableRow,
  DataTableCell as TableCell,
} from '../../components/shared/tableBody'
import ColoredButton from '../../components/themedReactToolbox/ColoredButton'
import { messages } from './SiteList'

const cssClasses = classnames.bind(
  require('../../components/shared/DataTableRow.css')
)

const enhance = _.identity

const SiteTableRow = ({ intl, site, ...restProps }) => (
  <TableRow {...restProps} className={cssClasses(restProps.className)}>
    <TableCell>{site.get('name')}</TableCell>
    <TableCell>{site.get('state')}</TableCell>
    <TableCell>{site.get('externalId')}</TableCell>
    <TableCell>{site.get('lga')}</TableCell>
    <TableCell>{site.get('totalDevices')}</TableCell>
    <TableCell>
      {site.get('siteIssues') &&
        site
          .get('siteIssues')
          .map(issue => (
            <ColoredButton
              key={issue}
              className={cssClasses('ColoredButton--micro')}
              label={intl.formatMessage(messages[_.camelCase(issue)])}
              shipCove={issue.startsWith('Device')}
              shakespeare={issue.startsWith('Reagent')}
              mountain={issue.startsWith('Connectivity')}
              brink={issue.startsWith('Data')}
            />
          ))}
    </TableCell>
  </TableRow>
)

export default enhance(SiteTableRow)
