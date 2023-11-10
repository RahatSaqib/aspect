import React from 'react'
import AspectLink from '../../../components/AspectLink'
import styles from './ReporterList.module.css'

const ReporterLinkCell = ({ data }) => (
  <AspectLink
    to={`/browse/site/${data.get('siteId')}`}
    className={{ active: styles.site__details, disabled: 'site__details site__details--disabled' }}
  >
    {data.get('siteName')}
  </AspectLink>
)

export default ReporterLinkCell
