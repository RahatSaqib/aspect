import React, { useState } from 'react'
import { Button, LinearProgress } from '@mui/material'
import classnames from 'classnames/bind'
import useI18n from '../../../hooks/useI18n'
import AspectDialog from '../../../oldComponents/shared/AspectDialog'
import messages from './messages'
import PersonAssignmentItem from './PersonAssignmentItem'
import styles from './PersonDetail.css'

const cssClasses = classnames.bind(styles)

export default ({ assignments, loadedAssignments, onDeleteAssignment }) => {
  const [confirmation, setConfirmation] = useState({ isActive: false })
  const onCancelConfirmation = () => setConfirmation({ isActive: false })
  const onConfirmRemove = () => {
    setConfirmation({ isActive: false })
    onDeleteAssignment(confirmation.assignment.jobContextId)
  }
  const askConfirmation = (assignment, index) => {
    setConfirmation({ isActive: true, assignment, index })
  }
  const { formatMessage } = useI18n()

  return (
    <section className={cssClasses('Assignments')}>
      <h4>{formatMessage(messages.assignments)}</h4>
      {!loadedAssignments && <LinearProgress />}
      {assignments.length === 0 && <h4>{formatMessage(messages.notSpecified)}</h4>}
      {assignments.map((assignment, idx) => (
        <PersonAssignmentItem
          key={`${assignment.jobFunctionId}-${assignment.jobId}-${idx}`}
          assignment={assignment}
          showLinks
          onAskConfirmation={askConfirmation}
        />
      ))}
      <AspectDialog
        actions={[
          <Button color="primary" onClick={onCancelConfirmation}>
            {formatMessage(messages.cancel)}
          </Button>,
          <Button color="primary" variant="contained" onClick={onConfirmRemove}>
            {formatMessage(messages.yesDelete)}
          </Button>,
        ]}
        maxWidth="sm"
        open={confirmation.isActive}
        onClose={onCancelConfirmation}
      >
        <h3>{formatMessage(messages.removeAssignment)}</h3>
        <PersonAssignmentItem assignment={confirmation.assignment} />
      </AspectDialog>
    </section>
  )
}
