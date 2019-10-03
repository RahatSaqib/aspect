import React from 'react'
import { Timeline } from 'react-material-timeline'
import { Avatar, Icon } from '@material-ui/core'
import Grid from '@material-ui/core/Grid'

const events = [
  {
    title: 'Event 1',
    subheader: new Date().toDateString(),
    description: <a href="prueba">ahoasdasd </a>,
    icon: (
      <Avatar>
        <Icon>work</Icon>
      </Avatar>
    ),
  },
  {
    title: 'Event 2',
    subheader: new Date().toDateString(),
    description: ['Some description for event 2'],
    icon: (
      <Avatar>
        <Icon>home</Icon>
      </Avatar>
    ),
  },
]

const AwesomeTimeline = milestones => (
  <Grid xs style={{ margin: 10 }}>
    <Timeline events={milestones || events} style={{ margin: 10 }} />
  </Grid>
)
export default AwesomeTimeline
