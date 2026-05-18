import React, { useEffect, useRef, useState } from 'react'
import { Box, Button, Card, Checkbox, FormControlLabel, Grid, MenuItem, TextField } from '@mui/material'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import padStart from 'lodash/padStart'
import times from 'lodash/times'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { useLocation, useNavigate } from 'react-router-dom'
import { ConsumableSelect, LocationSelector, SiteListSelect, TagInput, TimezoneSelect } from '../../../../components'
import PermissionChecker from '../../../../components/PermissionChecker'
import AspectDialog from '../../../../components/shared/AspectDialog'
import useCreateSite from '../../../../hooks/site/useCreateSite'
import useDeleteSite from '../../../../hooks/site/useDeleteSite'
import useSiteType from '../../../../hooks/site/useSiteType'
import useUpdateSite from '../../../../hooks/site/useUpdateSite'
import useAuthState from '../../../../hooks/useAuthState'
import { gotoReturnUrl } from '../../../../utils/utils/browser'
import { SITE_TYPE_EXTERNAL_IDS } from '../../siteTypes'
import messages from '../messages'
import styles from '../SiteDetail.module.css'
import { convertToFloat, getLatLongFromAddress } from './address'
import SiteTypeSelect from './SiteTypeSelect'

const SiteForm = ({ site, onLatLongChange }) => {
  const { formatMessage } = useIntl()
  const user = useAuthState()
  const navigate = useNavigate()
  const location = useLocation()
  const [showConfirmation, setShowConfirmation] = useState(false)
  const { data: siteTypes } = useSiteType()

  const { mutate: updateSite } = useUpdateSite(site.id)
  const { mutate: deleteSite } = useDeleteSite(site.id)
  const { mutate: createSite } = useCreateSite()
  const [submitting, setSubmitting] = useState(false)

  // Helper function to get default site type ID (lab)
  const getDefaultSiteTypeId = () => {
    if (!siteTypes) return null
    const labSiteType = siteTypes.find(st => st.externalId === SITE_TYPE_EXTERNAL_IDS.LAB)
    return labSiteType?.id || null
  }

  // Helper function to check if site type is clinic
  const isClinicSiteType = siteTypeId => {
    if (!siteTypeId || !siteTypes) return false
    const siteType = siteTypes.find(st => st.id === siteTypeId)
    return siteType?.externalId === SITE_TYPE_EXTERNAL_IDS.CLINIC
  }

  // Helper function to check if site type is warehouse
  const isWarehouseSiteType = siteTypeId => {
    if (!siteTypeId || !siteTypes) return false
    const siteType = siteTypes.find(st => st.id === siteTypeId)
    return siteType?.externalId === SITE_TYPE_EXTERNAL_IDS.WAREHOUSE
  }
  const initialState = {
    ...site,
    ...(!site.countryId ? { countryId: user.countryId } : {}),
    // Use siteTypeId from site data, or default to lab if not provided
    siteTypeId: site.siteTypeId || getDefaultSiteTypeId(),
    sampleRegistrationAllowed: Boolean(site.sampleRegistrationAllowed ?? isClinicSiteType(site.siteTypeId)),
  }

  const [editSite, setEditSite] = useState(initialState)
  const [queryParamsForWarehouse] = useState({
    siteTypeExternalIds: [SITE_TYPE_EXTERNAL_IDS.WAREHOUSE], // This is for the SiteListSelect component which expects external IDs
    excludeSiteIds: [site.id],
  })

  // Use ref to track if we're in the initial load
  const isInitialLoad = useRef(true)

  // Use ref to track the previous site type for comparison
  const previousSiteTypeId = useRef(site.siteTypeId)

  const isPristine = isEqual(initialState, editSite)
  const isWarehouse = isWarehouseSiteType(editSite.siteTypeId)
  const isNew = site.id === 0
  const goBack = () => gotoReturnUrl(navigate, location, '/browse/site')

  useEffect(
    () => onLatLongChange({ lat: editSite.latitude, lng: editSite.longitude }),
    [editSite.latitude, editSite.longitude, onLatLongChange]
  )

  // Auto-update sampleRegistrationAllowed only when user changes site type (not on initial load)
  useEffect(() => {
    // Skip the initial load only for edit mode (not for new sites)
    if (isInitialLoad.current && !isNew) {
      isInitialLoad.current = false
      previousSiteTypeId.current = editSite.siteTypeId
      return
    }

    // For new sites, always allow updates
    // For existing sites, only update if the site type has actually changed
    if (isNew || (!isNew && editSite.siteTypeId && editSite.siteTypeId !== previousSiteTypeId.current)) {
      const siteType = siteTypes?.find(st => st.id === editSite.siteTypeId)
      const shouldAllowSampleRegistration = siteType?.externalId === SITE_TYPE_EXTERNAL_IDS.CLINIC

      setEditSite(prev => ({
        ...prev,
        sampleRegistrationAllowed: shouldAllowSampleRegistration,
      }))
      // Update the previous site type
      previousSiteTypeId.current = editSite.siteTypeId
    }
  }, [editSite.siteTypeId, siteTypes, isNew])

  const updateSiteLatLong = async address => {
    getLatLongFromAddress(address).then(({ lat, lng }) => {
      setEditSite(originalSite => ({
        ...originalSite,
        latitude: convertToFloat(lat, 6),
        longitude: convertToFloat(lng, 6),
      }))
    })
  }

  const handleSubmit = async data => {
    setSubmitting(true)
    if (!data.longitude || !data.latitude) {
      delete editSite.parentWarehouseName
      await updateSiteLatLong({
        country: editSite.country,
        state: editSite.state,
        lga: editSite.lga,
        city: editSite.city,
        address: editSite.address,
      })
    }

    // Prepare the payload, removing siteTypeExternalId as it's not allowed by the backend
    const payload = { ...editSite }
    delete payload.siteTypeExternalId

    if (isNew) {
      createSite(payload, {
        onSuccess: newId => navigate(`/browse/site/${newId}${location.search}`),
        onSettled: () => setSubmitting(false),
      })
    } else {
      delete payload.selectedConsumables
      updateSite(payload, {
        onSuccess: navigate(`/browse/site/${site.id}${location.search}`),
        onSettled: () => setSubmitting(false),
      })
    }
  }

  const handleDelete = () => {
    deleteSite()
    setShowConfirmation(false)
    goBack()
  }

  function handleDeletePrompt() {
    setShowConfirmation(true)
  }

  const isError =
    !isPristine &&
    (isEmpty(editSite.name) ||
      isEmpty(editSite.shortName) ||
      isEmpty(editSite.countryId?.toString()) ||
      isEmpty(editSite.externalId) ||
      !editSite.siteTypeId ||
      (!isWarehouse && isEmpty(editSite.stateId?.toString())))

  return (
    <Box width="100%">
      <section className={`${styles.Section} ${styles.Section__first}`}>
        <Card className={styles.Section__Content}>
          <div className={styles.container}>
            <TextField
              className={styles.container__field}
              name="name"
              label={formatMessage(messages.fieldName)}
              margin="normal"
              fullWidth
              value={editSite.name}
              onChange={e =>
                isNew
                  ? setEditSite({ ...editSite, name: e.target.value, externalId: e.target.value })
                  : setEditSite({ ...editSite, name: e.target.value })
              }
              error={!isPristine && isEmpty(editSite.name)}
              helperText={!isPristine && isEmpty(editSite.name) && `${formatMessage(messages.fieldName)} is required`}
            />
            <TextField
              className={styles.container__field}
              name="shortName"
              label={formatMessage(messages.fieldShortName)}
              margin="normal"
              fullWidth
              value={editSite.shortName}
              onChange={e => setEditSite({ ...editSite, shortName: e.target.value })}
              error={!isPristine && isEmpty(editSite.shortName)}
              helperText={
                !isPristine && isEmpty(editSite.shortName) && `${formatMessage(messages.fieldShortName)} is required`
              }
            />
            <TextField
              className={styles.container__field}
              name="externalId"
              label={formatMessage(messages.fieldExternalId)}
              margin="normal"
              fullWidth
              value={editSite.externalId || ''}
              onChange={e => setEditSite({ ...editSite, externalId: e.target.value })}
              error={!isPristine && isEmpty(editSite.externalId)}
              helperText={
                !isPristine && isEmpty(editSite.externalId) && `${formatMessage(messages.fieldExternalId)} is required`
              }
            />
          </div>
          <div className={styles.container}>
            <SiteTypeSelect
              name="siteType"
              width="33%"
              className={styles.site_list_select}
              label={formatMessage(messages.fieldSiteType)}
              value={editSite.siteTypeId}
              onChange={siteTypeId => setEditSite({ ...editSite, siteTypeId })}
              error={!isPristine && !editSite.siteTypeId}
              helperText={!isPristine && !editSite.siteTypeId && `${formatMessage(messages.fieldSiteType)} is required`}
            />
            <TextField
              className={styles.container__field}
              name="address"
              label={formatMessage(messages.fieldAddress)}
              onBlur={() =>
                updateSiteLatLong({
                  country: editSite.country,
                  state: editSite.state,
                  lga: editSite.lga,
                  city: editSite.value,
                  address: editSite.street1,
                })
              }
              margin="normal"
              fullWidth
              value={editSite.street1}
              onChange={e => setEditSite({ ...editSite, street1: e.target.value })}
            />
            <TextField
              className={styles.container__field}
              name="address2"
              label={formatMessage(messages.fieldAddress2)}
              onBlur={() =>
                updateSiteLatLong({
                  country: editSite.country,
                  state: editSite.state,
                  lga: editSite.lga,
                  city: editSite.value,
                  address: editSite.street1,
                })
              }
              margin="normal"
              fullWidth
              value={editSite.street2 || ''}
              onChange={e => setEditSite({ ...editSite, street2: e.target.value })}
            />
          </div>
          <div className={styles.container}>
            <LocationSelector
              user={user}
              countryId={editSite.countryId}
              stateId={editSite.stateId}
              lgaId={editSite.lgaId}
              validators={{
                country: { error: !isPristine && isEmpty(editSite.countryId?.toString()) },
                state: !isWarehouse ? { error: !isPristine && isEmpty(editSite.stateId?.toString()) } : {},
              }}
              onChange={location => {
                setEditSite({
                  ...editSite,
                  countryId: location.country.id,
                  country: location.country.name,
                  stateId: location.state.id,
                  state: location.state.name,
                  lgaId: location.lga.id,
                  lga: location.lga.name,
                })
                if (!isNew) {
                  updateSiteLatLong({
                    country: location.country.name,
                    state: location.state.name,
                    lga: location.lga.name,
                    city: editSite.city,
                    address: editSite.street1,
                  })
                }
              }}
            />
          </div>
          <div className={styles.container}>
            <TextField
              className={styles.container__field}
              name="city"
              label={formatMessage(messages.fieldCity)}
              margin="normal"
              fullWidth
              value={editSite.city}
              onBlur={() =>
                updateSiteLatLong({
                  country: editSite.country,
                  state: editSite.state,
                  lga: editSite.lga,
                  city: editSite.value,
                  address: editSite.street1,
                })
              }
              onChange={e => setEditSite({ ...editSite, city: e.target.value })}
            />
            <TextField
              className={styles.container__field}
              name="zip"
              label={formatMessage(messages.fieldZip)}
              onBlur={() =>
                updateSiteLatLong({
                  country: editSite.country,
                  state: editSite.state,
                  lga: editSite.lga,
                  city: editSite.value,
                  address: editSite.street1,
                })
              }
              margin="normal"
              fullWidth
              value={editSite.zip}
              onChange={e => setEditSite({ ...editSite, zip: e.target.value })}
            />
            <SiteListSelect
              name="belongsTo"
              className={styles.site_list_select}
              width="33%"
              label={formatMessage(messages.fieldBelongTo)}
              value={editSite.parentWarehouseId || ''}
              onChange={parentWarehouseId => setEditSite({ ...editSite, parentWarehouseId })}
              queryParams={queryParamsForWarehouse}
              isClearable
            />
          </div>
          <div className={`${styles.container} ${styles.coordinate}`}>
            <TextField
              className={styles.container__field}
              name="longitude"
              label={formatMessage(messages.fieldLongitude)}
              margin="normal"
              fullWidth
              value={editSite.longitude}
              onChange={e => {
                setEditSite({ ...editSite, longitude: e.target.value })
              }}
            />
            <TextField
              className={styles.container__field}
              name="latitude"
              label={formatMessage(messages.fieldLatitude)}
              margin="normal"
              fullWidth
              value={editSite.latitude}
              onChange={e => {
                setEditSite({ ...editSite, latitude: e.target.value })
              }}
            />
            <div className={styles.coordinate__button}>
              <Button
                color="primary"
                variant="contained"
                onClick={() =>
                  updateSiteLatLong({
                    country: editSite.country,
                    state: editSite.state,
                    lga: editSite.lga,
                    city: editSite.value,
                    address: editSite.street1,
                  })
                }
              >
                {formatMessage(messages.buttonSetBasedonAddress)}
              </Button>
            </div>
          </div>
          <div className={styles.container}>
            <TimezoneSelect
              name="timezone"
              label={formatMessage(messages.fieldTimeZone)}
              width="33%"
              onChange={timezone => setEditSite({ ...editSite, timezone })}
              value={editSite.timezone || ''}
            />
            <span style={{ width: '33%' }}>
              <TextField
                select
                label={formatMessage(messages.fieldStartingHours)}
                variant="standard"
                style={{ width: '98%', marginRight: '1%', marginLeft: '1%', marginTop: '16px' }}
                value={editSite.hoursStart}
                onChange={e => setEditSite({ ...editSite, hoursStart: e.target.value })}
              >
                {times(24, hour => (
                  <MenuItem key={hour} value={hour}>
                    {`${padStart(hour, 2, '0')}:00`}
                  </MenuItem>
                ))}
              </TextField>
            </span>
            <span style={{ width: '33%' }}>
              <TextField
                select
                label={formatMessage(messages.fieldEndingHours)}
                variant="standard"
                style={{ width: '98%', marginRight: '1%', marginLeft: '1%', marginTop: '16px' }}
                value={editSite.hoursEnd}
                onChange={e => setEditSite({ ...editSite, hoursEnd: e.target.value })}
              >
                {times(24, hour => (
                  <MenuItem key={hour} value={hour}>
                    {`${padStart(hour, 2, '0')}:00`}
                  </MenuItem>
                ))}
              </TextField>
            </span>
          </div>

          <div className={`${styles.container} ${styles.coordinate}`}>
            <TextField
              label={formatMessage(messages.fieldNotes)}
              multiline
              rows={4}
              fullWidth
              value={editSite.notes || ''}
              onChange={e => setEditSite({ ...editSite, notes: e.target.value })}
            />
          </div>

          <TagInput
            type="site"
            label={formatMessage(messages.fieldTags)}
            onChange={tags => setEditSite(prv => ({ ...prv, tags }))}
            value={editSite?.tags ?? []}
          />

          <Grid container>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(editSite.sampleRegistrationAllowed)}
                    onChange={e => setEditSite({ ...editSite, sampleRegistrationAllowed: e.target.checked })}
                    color="primary"
                  />
                }
                label={formatMessage(messages.sampleRegistrationAllowed)}
              />
            </Grid>
          </Grid>

          <div style={{ height: 24 }} />

          {isNew ? (
            <ConsumableSelect
              label={formatMessage(messages.consumablesForSite)}
              valueBy="id"
              multiple
              value={editSite?.consumableIds ?? []}
              onChange={consumableIds => setEditSite(prv => ({ ...prv, consumableIds }))}
            />
          ) : null}

          <Button
            color="secondary"
            variant="contained"
            onClick={handleSubmit}
            disabled={isPristine || isError || submitting}
          >
            {isNew ? formatMessage(messages.buttonCreate) : formatMessage(messages.buttonUpdate)}
          </Button>
          {isNew ? null : (
            <PermissionChecker permissions={['site:admin']}>
              <Button
                disabled={!isPristine}
                style={{
                  marginLeft: '1rem',
                  backgroundColor: !isPristine ? 'rgba(0, 0, 0, 0.08)' : 'red',
                  color: 'white',
                }}
                type="button"
                color="error"
                variant="contained"
                onClick={handleDeletePrompt}
              >
                {formatMessage(messages.buttonDelete)}
              </Button>
            </PermissionChecker>
          )}

          <Button style={{ marginLeft: '1rem' }} type="button" variant="contained" onClick={goBack}>
            {formatMessage(messages.buttonBack)}
          </Button>

          <AspectDialog
            actions={[
              <Button color="primary" onClick={() => setShowConfirmation(false)}>
                {formatMessage(messages.cancel)}
              </Button>,
              <Button color="primary" variant="contained" onClick={() => handleDelete()}>
                {formatMessage(messages.yes)}
              </Button>,
            ]}
            maxWidth="sm"
            open={showConfirmation}
            onClose={() => setShowConfirmation(false)}
          >
            <h3>{formatMessage(messages.deleteSiteConfirmationTitle)}</h3>
            <div style={{ marginTop: '15px' }}>{formatMessage(messages.deleteSiteConfirmationMessage)}</div>
          </AspectDialog>
        </Card>
      </section>
    </Box>
  )
}

SiteForm.propTypes = {
  site: PropTypes.object,
  onLatLongChange: PropTypes.func,
}
SiteForm.defaultProps = {
  site: {
    id: 0,
    name: '',
    shortName: '',
    externalId: '',
    state: '',
    lga: '',
    country: '',
    createdOn: '',
    countryId: '',
    stateId: null,
    lgaId: null,
    timezone: '',
    city: '',
    zip: '',
    street1: '',
    street2: '',
    longitude: 0,
    latitude: 0,
    siteTypeId: null,
    hoursStart: 9,
    hoursEnd: 18,
    notes: '',
    parentWarehouseId: null,
    sampleRegistrationAllowed: false,
  },
  onLatLongChange: () => {},
}

export default SiteForm
