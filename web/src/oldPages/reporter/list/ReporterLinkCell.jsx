import React from 'react'
import classnames from 'classnames/bind'
import AspectLink from '../../../components/AspectLink'
import styles from './ReporterList.css'

const cssClasses = classnames.bind(styles)

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
