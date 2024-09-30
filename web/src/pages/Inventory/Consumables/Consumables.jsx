import React from 'react'
import { Checkbox, FormControlLabel, Stack, Typography } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import FormGroup from '@mui/material/FormGroup'
import { useConsumable } from '../../../hooks/inventory/useConsumable'
import useUpdateConsumable from '../../../hooks/site/useUpdateConsumable'
import Summary from '../../../oldComponents/Summary'

export default function Consumables({ siteId, consumableIds }) {
  const { data: { data: consumables } = {}, isLoading } = useConsumable()
  const { mutateAsync: changeApplicable, isLoading: isChanging } = useUpdateConsumable()
  return (
    <Summary
      title={
        <Stack direction="row" alignItems="center" gap={1}>
          <>Consumables applicable for the site</>
          {isChanging ? <CircularProgress size={15} /> : null}
        </Stack>
      }
      description={
        <>
          {isLoading ? (
            <Stack direction="row" alignItems="center" gap={1}>
              <CircularProgress size={15} />
              <Typography>Loading</Typography>
            </Stack>
          ) : (
            <FormGroup>
              {consumables?.map(({ name, id }) => (
                <FormControlLabel
                  id={id}
                  label={name}
                  key={id}
                  control={
                    <Checkbox
                      disabled={isChanging}
                      checked={consumableIds.includes(id)}
                      onChange={e =>
                        changeApplicable({
                          siteId,
                          modify: e.target.checked ? 'add' : 'remove',
                          consumable: { id, name },
                        })
                      }
                    />
                  }
                />
              ))}
            </FormGroup>
          )}
        </>
      }
    />
  )
}
