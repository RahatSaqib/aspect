import PropTypes from 'prop-types'
import React from 'react'
import { Select, MenuItem, Box, Chip } from '@material-ui/core'
import useAvailablePerson from '../../Hooks/person/useAvailablePerson'
import useUpdateContactByOperationAndSiteId from '../../Hooks/person/useUpdateContactByOperationAndSiteId'

const ContactTagInput = ({ siteId, value }) => {
  const { data: contacts } = useAvailablePerson()
  const { mutate: updateContacts } = useUpdateContactByOperationAndSiteId(siteId)
  const [open, setOpen] = React.useState(false)

  const handleClose = () => setOpen(false)
  const handleOpen = () => setOpen(true)

  const onChange = e =>
    updateContacts({ id: e.target.value.filter(v => typeof v === 'string')[0], operation: 'assign' })

  const handleDelete = id => updateContacts({ id, operation: 'unassign' })

  return (
    <Select
      multiple
      fullWidth
      variant="standard"
      value={value}
      onChange={onChange}
      open={open}
      onClose={handleClose}
      onOpen={handleOpen}
      onClick={handleClose}
      renderValue={selected => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {selected.map(value => (
            <Chip
              key={value.id}
              label={value.name}
              onDelete={() => handleDelete(value.id)}
              onMouseDown={event => {
                const isDelete = event.currentTarget.attributes.class.value.includes('deletable')
                if (isDelete) {
                  event.stopPropagation()
                }
              }}
            />
          ))}
        </Box>
      )}
    >
      {(contacts || []).map(tag => (
        <MenuItem key={tag.id} value={tag.id}>
          {tag.name}
        </MenuItem>
      ))}
    </Select>
  )
}

ContactTagInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  siteId: PropTypes.string.isRequired,
}

export default ContactTagInput
