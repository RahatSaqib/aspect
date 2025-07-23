import React from 'react'
import { Card, Checkbox, FormControlLabel, Grid } from '@mui/material'
import PropTypes from 'prop-types'
import PermissionChecker from '../../../../components/PermissionChecker'
import { commonDefinitions, getCustomMessage } from '../../../../messages/customMessages'
import Summary from '../../../../oldComponents/Summary'
import Consumables from '../../../Inventory/Consumables/Consumables'
import Contacts from '../Contacts/Contacts'
import localMessages from '../messages'
import styles from '../SiteDetail.module.css'

const messages = { ...commonDefinitions, ...localMessages }

const formatHour = hour => (hour != null ? `${String(hour).padStart(2, '0')}:00` : '')

const formatHoursOfOperation = (startHour, endHour) => {
  const start = formatHour(startHour)
  const end = formatHour(endHour)

  // If both values are empty/null/undefined
  if (!start && !end) {
    return ''
  }

  // If only one value exists
  if (start && !end) {
    return `${start} -`
  }
  if (!start && end) {
    return `- ${end}`
  }

  // If both values exist
  if (start && end) {
    return `${start} - ${end}`
  }

  return ''
}

// Helper function to show dash for empty values
const getDisplayValue = value => {
  if (value === null || value === undefined || value === '') {
    return '—'
  }
  return value
}

const SiteDetailProfile = ({ site, formatMessage, disabled, user }) => {
  const fields = [
    { label: formatMessage(messages.fieldName), value: getDisplayValue(site.name) },
    { label: formatMessage(messages.fieldShortName), value: getDisplayValue(site.shortName) },
    { label: formatMessage(messages.fieldExternalId), value: getDisplayValue(site.externalId) },
    { label: formatMessage(messages.fieldSiteType), value: getDisplayValue(site.siteType) },
    {
      label: formatMessage(messages.fieldAddress),
      value: [
        getDisplayValue(site.street1),
        site.street2,
        getDisplayValue(site.zip) ? `, ${getDisplayValue(site.zip)}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    },
    { label: getCustomMessage(formatMessage, messages, 'state', user), value: getDisplayValue(site.state) },
    { label: getCustomMessage(formatMessage, messages, 'lga', user), value: getDisplayValue(site.lga) },
    { label: formatMessage(messages.fieldCity), value: getDisplayValue(site.city) },
    { label: formatMessage(messages.fieldTimeZone), value: getDisplayValue(site.timezone) },
    { label: formatMessage(messages.fieldLongitude), value: getDisplayValue(site.longitude) },
    { label: formatMessage(messages.fieldLatitude), value: getDisplayValue(site.latitude) },
    {
      label: formatMessage(messages.fieldHoursOfOperation),
      value: formatHoursOfOperation(site.hoursStart, site.hoursEnd),
    },
    { label: formatMessage(messages.fieldBelongTo), value: getDisplayValue(site.parentWarehouseName) },
    { label: formatMessage(messages.fieldNotes), value: getDisplayValue(site.notes) },
    {
      label: formatMessage(messages.fieldDevices),
      value: site.devices?.map(device => ({ description: device.name, to: `/browse/device/list/${device.id}` })),
    },
    { label: formatMessage(messages.fieldTags), value: site?.tags.map(tag => tag.title).join(', ') },
    {
      label: '',
      value: (
        <FormControlLabel
          control={<Checkbox checked={site.sampleRegistrationAllowed || false} disabled color="primary" />}
          label={formatMessage(messages.sampleRegistrationAllowed)}
          sx={{ m: 0 }}
        />
      ),
    },
  ]
  return (
    <div>
      <section className={`${styles.Section} ${styles.Section__first}`}>
        {' '}
        <Card className={styles.Section__Content}>
          <Grid container>
            <Grid item xs={12} md={6}>
              {fields.map(({ label, value }) => (
                <Summary
                  key={`${label}_${site.id}`}
                  title={label}
                  description={getDisplayValue(value) || ''}
                  cols="1"
                />
              ))}
              <PermissionChecker permissions={['person:view', 'admin', 'person:admin', 'person:edit']}>
                <Contacts
                  id={site.id}
                  formatMessage={formatMessage}
                  title={formatMessage(messages.fieldContact)}
                  disabled={disabled}
                />
              </PermissionChecker>
            </Grid>
            <Grid item xs={12} md={6}>
              <PermissionChecker permissions={['inventory:edit']}>
                <Consumables
                  siteId={site.id}
                  consumableIds={site.consumableIds}
                  fixedConsumables={site.selectedConsumables}
                />
              </PermissionChecker>
            </Grid>
          </Grid>
        </Card>
      </section>
    </div>
  )
}

SiteDetailProfile.propTypes = {
  formatMessage: PropTypes.func.isRequired,
  site: PropTypes.object.isRequired,
  disabled: PropTypes.bool.isRequired,
  user: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default SiteDetailProfile
