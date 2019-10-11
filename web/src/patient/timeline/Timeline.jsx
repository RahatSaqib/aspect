import React from 'react'
import { format } from 'date-fns'
import Grid from '@material-ui/core/Grid'
import classnames from 'classnames/bind'
import Typography from '@material-ui/core/Typography'

const cssClasses = classnames.bind(require('./Timeline.css'))

const AspectTimelineItem = ({ data }) => (
  <Grid container spacing={2}>
    <Grid item className={cssClasses('timecell')}>
      <time>{format(data.date, 'MMM d, yyyy ')}</time>
    </Grid>
    <Grid item xs={12} sm container style={{ padding: 10 }}>
      <Grid item xs container direction="column" spacing={2}>
        <Grid item xs>
          <Typography
            gutterBottom
            variant="subtitle1"
            style={{
              display: 'inline-block',
              color: '#444853',
              fontWeight: 700,
            }}
          >
            {data.title}
          </Typography>
          <Typography variant="body2" gutterBottom>
            {data.subtitle}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {data.details}
          </Typography>
        </Grid>
      </Grid>
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
