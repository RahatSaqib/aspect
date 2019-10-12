import React from 'react'
import { format, parseISO } from 'date-fns'
import Grid from '@material-ui/core/Grid'
import classnames from 'classnames/bind'

const cssClasses = classnames.bind(require('./Timeline.css'))

const AspectTimelineItem = ({ data, details }) => (
  <Grid container spacing={2}>
    <Grid item className={cssClasses('timecell')}>
      <time>{format(parseISO(data.date), 'MMM d, yyyy ')}</time>
    </Grid>
    <Grid item xs={12} sm container style={{ padding: 10 }}>
      <Grid item xs container direction="column" spacing={2} />
    </Grid>
  </Grid>
)
const AspectTimeline = ({ items, title }) => (
  <div style={{ margin: 20 }}>
    <section className={cssClasses('intro')}>
      <div className={cssClasses('container')}>
        <h1>{title}</h1>
      </div>
    </section>
    {items.map(data => [<AspectTimelineItem data={data} />])}
  </div>
)
export default AspectTimeline
