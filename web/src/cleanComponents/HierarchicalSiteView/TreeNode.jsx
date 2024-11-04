import React from 'react'
import { Stack, Typography } from '@mui/material'
import { FaChevronDown, FaChevronRight } from 'react-icons/fa'

export function TreeNode(props) {
  const { data, callback, children, selected, expanded, options = {} } = props
  const { id, name } = data
  const { showChevron, noLeftPadding } = options

  return (
    <Stack sx={{ justifyContent: 'center', pl: noLeftPadding ? 0 : 2 }} spacing={2}>
      <Stack
        sx={{ flexDirection: 'row', cursor: 'pointer', alignItems: 'center' }}
        onClick={() => callback(id)}
        gap={1}
      >
        {showChevron && (selected || expanded ? <FaChevronDown fontSize={12} /> : <FaChevronRight fontSize={12} />)}
        <Typography variant="body2" sx={{ fontWeight: selected ? 'bold' : 'unset' }}>
          {name}
        </Typography>
      </Stack>
      {children}
    </Stack>
  )
}
