import React, { useState } from 'react'
import Button from '@material-ui/core/Button'
import classnames from 'classnames/bind'
import LinearProgress from '@material-ui/core/LinearProgress'

import AspectDialog from '../../components/shared/AspectDialog'

import messages from './messages'
import PersonAssignment from './PersonAssignmentItem'

const cssClasses = classnames.bind(require('./PersonDetail.css'))

export default ({
  intl,
  assignments,
  loadedAssignments,
  onDeleteAssignment,
}) => {
  const [confirmation, setConfirmation] = useState({ isActive: false })
  const onCancelConfirmation = () => setConfirmation({ isActive: false })
  const onConfirmRemove = () => {
    setConfirmation({ isActive: false })
    onDeleteAssignment(confirmation.assignment.jobContextId)
  }
  const askConfirmation = (assignment, index) => {
    setConfirmation({ isActive: true, assignment, index })
  }

  return (
    <section className={cssClasses('Assignments')}>
      <h1>{intl.formatMessage(messages.assignments)}</h1>
      {!loadedAssignments && <LinearProgress />}
      {assignments.length === 0 && <h4>Not specified</h4>}
      {assignments.map(assignment => (
        <PersonAssignment
          assignment={assignment}
          showLinks
          onAskConfirmation={askConfirmation}
          intl={intl}
        />
      ))}

      <AspectDialog
        actions={[
          <Button color="primary" onClick={onCancelConfirmation}>
            {intl.formatMessage(messages.cancel)}
          </Button>,
          <Button color="primary" variant="contained" onClick={onConfirmRemove}>
            {intl.formatMessage(messages.yesDelete)}
          </Button>,
        ]}
        maxWidth="sm"
        open={confirmation.isActive}
        onEscapeKeyDown={onCancelConfirmation}
        onClose={onCancelConfirmation}
      >
        <h3>Do you want to remove below assignment?</h3>
        <PersonAssignment assignment={confirmation.assignment} intl={intl} />
      </AspectDialog>
    </section>
  )
}
