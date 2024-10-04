import React from 'react'
import CheckBoxList from '../../../../cleanComponents/CheckBoxList'
import useSiteList from '../../../../hooks/site/useSiteList'
import useUpdateConsumable from '../../../../hooks/site/useUpdateConsumable'

export const TrackByLocation = ({ siteIds, consumableId, disabledSites = [] }) => {
  const { mutateAsync: changeApplicable, isLoading: isChanging } = useUpdateConsumable()
  const { data: sites, isLoading } = useSiteList()

  const handleSelectAll = (checked, id) => {
    if (id) {
      changeApplicable({
        siteId: id,
        modify: checked ? 'add' : 'remove',
        consumable: { id: consumableId },
      })
    } else {
      sites.forEach(({ id }) => {
        if (!disabledSites.includes(id)) {
          changeApplicable({
            siteId: id,
            modify: checked ? 'add' : 'remove',
            consumable: { id: consumableId },
          })
        }
      })
    }
  }

  return (
    <CheckBoxList
      listData={sites}
      isChanging={isChanging}
      disabledList={disabledSites}
      selectedList={siteIds}
      onSelect={handleSelectAll}
      isLoading={isLoading}
    />
  )
}
