import React from 'react'
import CircularProgress from '@mui/material/CircularProgress'
import PropTypes from 'prop-types'
import { defineMessages } from 'react-intl'
import useI18n from '../../hooks/useI18n'
import styles from './SiteLocationFormMap.css'
import SiteMap from './SiteMap'

const messages = defineMessages({
  findingLocation: {
    id: 'pages.SiteLocationFormMap.findingLocation',
    defaultMessage: 'Finding Location',
  },
})

/*
 * This component deals with four location values:
 *   1. latLng pair in 'siteDetail' form state
 *   2. latLng pair in site object from API response
 *   3. full address object in 'siteDetail' form state
 *   4. full address object in site object from API response
 * It finds the location in order and display it in the Map component.
 * If no latLng pair is found, it utilize Geocoder to decode full address object
 * into a latLng pair.
 */
const SiteLocationFormMap = ({ latLong }) => {
  const { formatMessage } = useI18n()

  return (
    <div className={styles.Container}>
      {latLong ? (
        <SiteMap position={latLong} />
      ) : (
        <div>
          <p>{formatMessage(messages.findingLocation)}</p>
          <CircularProgress />
        </div>
      )}
    </div>
  )
}

SiteLocationFormMap.propTypes = {
  latLong: PropTypes.shape({ lat: PropTypes.number.isRequired, lng: PropTypes.number.isRequired }).isRequired,
}

export default SiteLocationFormMap
