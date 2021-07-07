import React, { useState } from 'react'
import Button from '@material-ui/core/Button'
import classnames from 'classnames/bind'
import LinearProgress from '@material-ui/core/LinearProgress'

import AspectDialog from '../../components/shared/AspectDialog'

import messages from './messages'
import PersonAssignment from './PersonAssignmentItem'
import useI18n from '../../Hooks/i18n/useI18n'

const cssClasses = classnames.bind(require('./PersonDetail.css'))

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
      <h1>{formatMessage(messages.assignments)}</h1>
      {!loadedAssignments && <LinearProgress />}
      {assignments.length === 0 && <h4>Not specified</h4>}
      {assignments.map(assignment => (
        <PersonAssignment
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
        onEscapeKeyDown={onCancelConfirmation}
        onClose={onCancelConfirmation}
      >
        <h3>Do you want to remove below assignment?</h3>
        <PersonAssignment assignment={confirmation.assignment} />
      </AspectDialog>
    </section>
  )
}
