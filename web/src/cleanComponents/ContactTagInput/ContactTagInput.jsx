import React from 'react'
import { Select, MenuItem, Box, Chip } from '@mui/material'
import get from 'lodash/get'
import isObject from 'lodash/isObject'
import last from 'lodash/last'
import PropTypes from 'prop-types'
import useAvailablePerson from '../../hooks/person/useAvailablePerson'
import useUpdateContactByOperationAndSiteId from '../../hooks/person/useUpdateContactByOperationAndSiteId'

const ContactTagInput = ({ siteId, value }) => {
  const { data: contacts } = useAvailablePerson()
  const { mutate: updateContacts } = useUpdateContactByOperationAndSiteId(siteId)
  const [open, setOpen] = React.useState(false)

  const handleClose = () => setOpen(false)
  const handleOpen = () => setOpen(true)

  const onChange = e => {
    const latest = last(e.target.value)
    const id = isObject(latest) ? get(latest, 'id') : latest
    if (id) updateContacts({ id, operation: 'assign' })
  }

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
  siteId: PropTypes.number.isRequired,
}

export default ContactTagInput
