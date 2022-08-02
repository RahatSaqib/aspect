import PropTypes from 'prop-types'
import React from 'react'
import { Select, MenuItem, Box, Chip } from '@material-ui/core'
import useTagByType from '../../Hooks/tag/useTagByType'

const MAX_TAGS = 10

const SiteTagInput = ({ value, onTagChange }) => {
  const { data: possibleTags } = useTagByType('site')
  const [open, setOpen] = React.useState(false)

  const handleClose = () => setOpen(false)
  const handleOpen = () => setOpen(true)

  const onChange = e => {
    if (e.target.value.length < MAX_TAGS) {
      const newValues = e.target.value
        .map(v => (typeof v === 'string' ? possibleTags.find(t => t.id === v).title : v.title))
        .join()
      onTagChange(newValues)
    }
  }

  const handleDelete = id => {
    const newValues = value
      .filter(v => v.id !== id)
      .map(v => (typeof v === 'string' ? possibleTags.find(t => t.id === v).title : v.title))
      .join()
    onTagChange(newValues)
  }

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
              label={value.title}
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
      {(possibleTags || []).slice(0, MAX_TAGS).map(tag => (
        <MenuItem key={tag.id} value={tag.id}>
          {tag.title}
        </MenuItem>
      ))}
    </Select>
  )
}

SiteTagInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.array, PropTypes.object]).isRequired,
  onTagChange: PropTypes.func.isRequired,
}

export default SiteTagInput
