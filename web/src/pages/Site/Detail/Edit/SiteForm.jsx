import React, { useEffect, useState, useCallback } from 'react'
import { Box, Button, Card, MenuItem, TextField } from '@mui/material'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import isNil from 'lodash/isNil'
import padStart from 'lodash/padStart'
import times from 'lodash/times'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  SiteListSelect,
  SiteTagInput,
  LocationSelector,
  TimezoneSelect,
  ConsumableSelect,
} from '../../../../cleanComponents'
import PermissionChecker from '../../../../components/PermissionChecker'
import useCreateSite from '../../../../hooks/site/useCreateSite'
import useDeleteSite from '../../../../hooks/site/useDeleteSite'
import useUpdateSite from '../../../../hooks/site/useUpdateSite'
import useAuthState from '../../../../hooks/useAuthState'
import AspectDialog from '../../../../oldComponents/shared/AspectDialog'
import { gotoReturnUrl } from '../../../../utils/utils/browser'
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

  const { mutate: updateSite } = useUpdateSite(site.id)
  const { mutate: deleteSite } = useDeleteSite(site.id)
  const { mutate: createSite } = useCreateSite()
  const [submitting, setSubmitting] = useState(false)
  const [editSite, setEditSite] = useState({ ...site })
  const [queryParamsForWarehouse] = useState({ siteTypeExternalIds: ['warehouse'], excludeSiteIds: [site.id] })

  const isPristine = isEqual(site, editSite)
  const isNew = site.id === 0
  const goBack = useCallback(() => gotoReturnUrl(navigate, location, '/browse/site'), [navigate, location])

  useEffect(
    () => onLatLongChange({ lat: editSite.latitude, lng: editSite.longitude }),
    [editSite.latitude, editSite.longitude, onLatLongChange]
  )

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
      await updateSiteLatLong({
        country: editSite.country,
        state: editSite.state,
        lga: editSite.lga,
        city: editSite.city,
        address: editSite.address,
      })
    }
    if (isNew) {
      createSite(editSite, {
        onSuccess: newId => navigate(`/browse/site/${newId}${location.search}`),
        onSettled: () => setSubmitting(false),
      })
    } else {
      updateSite(editSite, {
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
    (isEmpty(editSite.name) || isEmpty(editSite.shortName) || isNil(editSite.countryId) || isEmpty(editSite.externalId))

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
              validators={{ country: { error: !isPristine && isNil(editSite.countryId), helperText: 'is required' } }}
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

          <SiteTagInput
            label={formatMessage(messages.fieldTags)}
            onChange={tags => setEditSite(prv => ({ ...prv, tags }))}
            value={editSite?.tags ?? []}
          />

          {isNew ? (
            <ConsumableSelect
              label={formatMessage(messages.consumablesForSite)}
              valueBy="id"
              multiple
              value={editSite?.consumableIds ?? []}
              onChange={consumableIds => setEditSite(prv => ({ ...prv, consumableIds }))}
            />
          ) : null}

          <div className={`${styles.container} ${styles.coordinate}`}>
            <TextField
              label={formatMessage(messages.fieldNotes)}
              multiline
              rows={4}
              fullWidth
              defaultValue={editSite.notes}
              onChange={e => setEditSite({ ...editSite, notes: e.target.value })}
            />
          </div>
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
    stateId: '',
    lgaId: '',
    timezone: '',
    city: '',
    zip: '',
    street1: '',
    street2: '',
    longitude: 0,
    latitude: 0,
    siteTypeId: 1,
    hoursStart: 9,
    hoursEnd: 18,
    notes: '',
    parentWarehouseId: null,
  },
  onLatLongChange: () => {},
}

export default SiteForm
