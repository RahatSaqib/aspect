import React from 'react'
import { Typography } from '@mui/material'
import { CheckBoxList } from '../../../cleanComponents'
import { useConsumable } from '../../../hooks/inventory/useConsumable'
import useUpdateConsumable from '../../../hooks/site/useUpdateConsumable'

const Consumables = ({ consumableIds, siteId, disabledSites }) => {
  const { mutateAsync: changeApplicable, isLoading: isChanging } = useUpdateConsumable()
  const { data: { data: consumables } = {}, isLoading } = useConsumable()

  const handleSelectAll = (checked, id) => {
    if (id) {
      changeApplicable({
        siteId,
        modify: checked ? 'add' : 'remove',
        consumable: { id },
      })
    } else {
      consumables.forEach(({ id }) => {
        if (!disabledSites?.includes(id)) {
          changeApplicable({
            siteId,
            modify: checked ? 'add' : 'remove',
            consumable: { id },
          })
        }
      })
    }
  }

  return (
    <>
      <Typography>Consumables applicable for this site</Typography>
      <CheckBoxList
        listData={consumables}
        isChanging={isChanging}
        disabledList={disabledSites}
        selectedList={consumableIds}
        onSelect={handleSelectAll}
        isLoading={isLoading}
      />
    </>
  )
}

export default Consumables
