import React from 'react'
import { Grid } from '@mui/material'
import classnames from 'classnames/bind'
import format from 'date-fns/format'
import parseISO from 'date-fns/parseISO'
import styles from './Timeline.css'

const cssClasses = classnames.bind(styles)

const AspectTimelineItem = ({ data }) => (
  <Grid container spacing={2} style={{ display: 'table' }}>
    <Grid item className={cssClasses('timecell')} style={{ display: 'table-cell', verticalAlign: 'middle' }}>
      <time>{format(parseISO(data.date), 'MMM d, yyyy ')}</time>
    </Grid>
    <Grid item xs={12} sm container style={{ padding: 10 }}>
      <Grid className={cssClasses('resultCell')} item xs container direction="column" spacing={2}>
        {data.details}
      </Grid>
    </Grid>
  </Grid>
)
const AspectTimeline = ({ items, title }) => (
  <div style={{ margin: 20 }}>
    <section className={cssClasses('intro')}>
      <div className={cssClasses('container')}>
        <p data-panel-title>{title}</p>
      </div>
    </section>
    {items.map(data => [<AspectTimelineItem data={data} />])}
  </div>
)
export default AspectTimeline
