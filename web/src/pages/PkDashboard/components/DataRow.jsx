import React, { useMemo } from 'react'
import { Stack, Typography, Divider } from '@mui/material'
import AspectTooltip from '../../../components/shared/AspectTooltip'
import styles from './DataRow.module.css'

const DataRow = ({ label, value, info, valueTooltip, ...props }) => {
  const data = useMemo(
    () => (
      <Stack direction="row" gap={1}>
        <Typography sx={{ fontSize: 32, color: '#009688' }}>{value}</Typography>
        {info ? <Typography sx={{ fontSize: 14 }}>{info}</Typography> : null}
      </Stack>
    ),
    [info, value]
  )

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" {...props}>
      <Typography sx={{ fontSize: 16, fontWeight: 500 }}>{label}</Typography>
      {value ? (
        <>
          <Divider />
          {valueTooltip ? (
            <AspectTooltip showHelpIcon title={valueTooltip} toolTipContainerClass={styles.inline__tooltip}>
              {data}
            </AspectTooltip>
          ) : (
            data
          )}
        </>
      ) : null}
    </Stack>
  )
}

export default DataRow
