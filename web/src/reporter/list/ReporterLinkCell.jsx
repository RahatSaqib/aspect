import React from 'react'
import classnames from 'classnames/bind'

import AspectLink from '../../MigratedComponents/AspectLink'

const cssClasses = classnames.bind(require('./ReporterList.css'))

const ReporterLinkCell = ({ data }) => (
  <AspectLink
    to={`/browse/site/${data.get('siteId')}`}
    className={{
      active: cssClasses('site__details'),
      disabled: cssClasses('site__details', 'site__details--disabled'),
    }}
  >
    {data.get('siteName')}
  </AspectLink>
)

export default ReporterLinkCell
