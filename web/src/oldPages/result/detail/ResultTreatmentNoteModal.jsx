import React from 'react'
import { Button, TextField } from '@mui/material'
import AspectDialog from '../../components/shared/AspectDialog'

const ResultTreatmentNoteModal = ({ restProps }) => (
  <AspectDialog
    actions={[
      <Button color="primary" onClick={restProps.onToggleShown}>
        Cancel
      </Button>,
      <Button color="primary" variant="contained" disabled={!restProps.isActive} onClick={restProps.onNoteSubmit}>
        Submit
      </Button>,
    ]}
    maxWidth="sm"
    open={restProps.isShown}
    onClose={restProps.onToggleShown}
    title="Add Note"
  >
    <div data-note-text-input>
      <TextField
        id="standard-multiline-flexible"
        multiline
        maxRows="5"
        placeholder="click and start adding notes"
        onChange={restProps.onNoteChange}
        margin="normal"
      />
    </div>
  </AspectDialog>
)

export default ResultTreatmentNoteModal
