import React from 'react'
import useImplementingPartners from '../../hooks/partner/useImplementingPartners'
import AspectSelect from '../AspectSelect'

export default function ImplementingPartnerSelect(props) {
  const { isLoading, data: options } = useImplementingPartners()

  return <AspectSelect isLoading={isLoading} options={options} itemToString={i => i?.label ?? ''} {...props} />
}
