import React from 'react'
import { LoadScript } from '@react-google-maps/api'
import AspectMaps from '../index'

const markers = [
  { id: 120, lat: 42.101116, lng: 77.394417, color: '#4bc97f' },
  { id: 108, lat: 32.925388, lng: -83.437553, color: '#e65a5a' },
  { id: 132, lat: 44.954861, lng: -121.662003, color: '#4b8ac9' },
]

export default {
  title: 'components/AspectMaps',
  component: AspectMaps,
}

const Template = args => (
  <LoadScript googleMapsApiKey="AIzaSyBQBPFZ6XgHYfnmHGiXXiZmainIEwZS5HQ">
    <AspectMaps config={args} />
  </LoadScript>
)

export const Default = Template.bind({})

Default.args = {
  zoom: 15,
  centre: markers[0],
  fitMarkers: true,
  containerStyle: {
    width: '100%',
    height: '300px',
  },
  markers: {
    size: 40,
    click: () => false,
    data: markers,
  },
  options: {
    gestureHandling: 'cooperative',
  },
}
