import React from 'react'
import { Checkbox, FormControlLabel, Stack, Typography } from '@mui/material'
import CircularProgress from '@mui/material/CircularProgress'
import FormGroup from '@mui/material/FormGroup'
import useSiteList from '../../../../hooks/site/useSiteList'
import useUpdateConsumable from '../../../../hooks/site/useUpdateConsumable'
import Summary from '../../../../oldComponents/Summary'

export const TrackByLocation = ({ siteIds, consumableId }) => {
  const { data: sites, isLoading } = useSiteList()
  const { mutateAsync: changeApplicable, isLoading: isChanging } = useUpdateConsumable()

  return (
    <Summary
      title={
        <Stack
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {isChanging ? <CircularProgress size={15} /> : null}
        </Stack>
      }
      description={
        <>
          {isLoading ? (
            <Stack
              sx={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CircularProgress size={15} />
              <Typography>Loading</Typography>
            </Stack>
          ) : (
            <FormGroup>
              {sites.map(({ name, id }) => (
                <FormControlLabel
                  id={id}
                  label={name}
                  key={id}
                  control={
                    <Checkbox
                      disabled={isChanging}
                      checked={siteIds?.includes(id)}
                      onChange={e =>
                        changeApplicable({
                          siteId: id,
                          modify: e.target.checked ? 'add' : 'remove',
                          consumable: { id: consumableId },
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
