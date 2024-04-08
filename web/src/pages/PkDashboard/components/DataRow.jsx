import React from 'react'
import { Stack, Typography, Divider } from '@mui/material'
import AspectTooltip from '../../../oldComponents/shared/AspectTooltip'
import styles from './DataRow.css'

const DataRow = ({ label, value, valueTooltip, ...props }) => {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" {...props}>
      <Typography sx={{ fontSize: 16, fontWeight: 500 }}>{label}</Typography>
      {value ? (
        <>
          <Divider />
          {valueTooltip ? (
            <AspectTooltip showHelpIcon title={valueTooltip} toolTipContainerClass={styles.inline__tooltip}>
              <Typography sx={{ fontSize: 32, color: '#009688' }}>{value}</Typography>
            </AspectTooltip>
          ) : (
            <Typography sx={{ fontSize: 32, color: '#009688' }}>{value}</Typography>
          )}
        </>
      ) : null}
    </Stack>
  )
}

export default DataRow
