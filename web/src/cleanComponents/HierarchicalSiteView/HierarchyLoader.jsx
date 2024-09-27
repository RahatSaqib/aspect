import React from 'react'
import { Skeleton, Stack } from '@mui/material'

export function HierarchyLoader() {
  return (
    <Stack>
      {Array(3)
        .fill()
        .map((_, key) => (
          <Skeleton height={40} key={key} />
        ))}
    </Stack>
  )
}
