import React from 'react'
import AspectSelect from '../AspectSelect'

export const cepheidModulesOptions = [
  { label: 'Standard - 6 Color', value: '6cModules' },
  { label: 'XDR - 10 Color', value: '10cModules' },
]
export default function CepheidModulesSelect(props) {
  return <AspectSelect options={cepheidModulesOptions} itemToString={i => i?.label ?? ''} {...props} />
}
