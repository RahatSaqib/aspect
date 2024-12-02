import React from 'react'
import { Typography, Box } from '@mui/material'
import { CheckBoxList } from '../../../cleanComponents'
import { useConsumable } from '../../../hooks/inventory/useConsumable'
import useUpdateConsumable from '../../../hooks/site/useUpdateConsumable'
import AspectTooltip from '../../../oldComponents/shared/AspectTooltip'
import messages from './messages'
import { useIntl } from 'react-intl'

const Consumables = ({ consumableIds, siteId, disabledSites }) => {
  const { mutateAsync: changeApplicable, isLoading: isChanging } = useUpdateConsumable()
  const { data: { data: consumables } = {}, isLoading } = useConsumable()

  const { formatMessage } = useIntl()

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
      <Box display="flex" alignItems="center">
        <Typography>{formatMessage(messages.consumablesapplicableforthissite)}</Typography>
        <AspectTooltip
          showHelpIcon
          title="Some consumables may appear unavailable for selection change as the site has inventory or unreconciled transactions"
        />
      </Box>

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
