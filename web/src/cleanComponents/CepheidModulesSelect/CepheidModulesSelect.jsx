import React from 'react'
import AspectSelect from '../AspectSelect'

const options = [
  { label: 'Standard - 6 Color', value: '6cModules' },
  { label: 'XDR - 10 Color', value: '10cModules' },
]
export default function CepheidModulesSelect(props) {
  return <AspectSelect options={options} itemToString={i => i?.label ?? ''} {...props} />
}
