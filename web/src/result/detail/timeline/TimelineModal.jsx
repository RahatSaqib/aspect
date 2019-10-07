import React from 'react'

import AspectDialog from '../../../components/shared/AspectDialog'
import AwesomeTimeline from './AwesomeTimeline'

const TimelineModal = ({ restProps }) => (
  <AspectDialog
    maxWidth="lg"
    open={restProps.isShown}
    onClose={restProps.onToggleShown}
    title="Patient History"
  >
    <AwesomeTimeline />
  </AspectDialog>
)

export default TimelineModal
