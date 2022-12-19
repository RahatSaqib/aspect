import React, { useEffect, useState } from 'react'
import { Button, Card, MenuItem, TextField } from '@mui/material'
import classnames from 'classnames/bind'
import isEmpty from 'lodash/isEmpty'
import isEqual from 'lodash/isEqual'
import padStart from 'lodash/padStart'
import times from 'lodash/times'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import LocationSelector from '../../../../components/LocationSelector'
import SiteListSelect from '../../../../components/SiteListSelect'
import SiteTagInput from '../../../../components/SiteTagInput'
import TimezoneSelect from '../../../../components/TimezoneSelect'
import useCreateSite from '../../../../hooks/site/useCreateSite'
import useDeleteSite from '../../../../hooks/site/useDeleteSite'
import useUpdateSite from '../../../../hooks/site/useUpdateSite'
import useUpdateTagByTypeAndId from '../../../../hooks/tag/useUpdateTagByTypeAndId'
import useI18n from '../../../../hooks/useI18n'
import AspectButton from '../../../../oldComponents/shared/AspectButton'
import AspectDialog from '../../../../oldComponents/shared/AspectDialog'
import { ReadOnlyField } from '../../../../oldComponents/shared/ReadOnlyFields'
import { useAuthState } from '../../../../providers/AuthProvider'
import PermissionsProvider from '../../../../providers/PermissionsProvider'
import messages from '../messages'
import styles from '../SiteDetail.css'
import { getLatLongFromAddress, convertToFloat } from './address'
import SiteTypeSelect from './SiteTypeSelect'

const cssClasses = classnames.bind(styles)

const SiteForm = ({ site, siteTags, onLatLongChange }) => {
  const { formatMessage } = useI18n()
  const user = useAuthState()
  const navigate = useNavigate()
  const [showConfirmation, setShowConfirmation] = useState(false)

  const { mutate: updateSite } = useUpdateSite(site.id)
  const { mutate: updateTags } = useUpdateTagByTypeAndId('site', site.id)
  const { mutate: deleteSite } = useDeleteSite(site.id)
  const { mutate: createSite } = useCreateSite()

  const [editSite, setEditSite] = useState({ ...site })
  const [queryParamsForWarehouse] = useState({ siteTypeExternalIds: ['warehouse'], excludeSiteIds: [site.id] })

  const isPristine = isEqual(site, editSite)
  const isNew = site.id === 0

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
      createSite(editSite, { onSuccess: newId => navigate(`/browse/site/${newId}`) })
    } else {
      updateSite(editSite, { onSuccess: navigate(`/browse/site/${site.id}`) })
    }
  }

  const handleDelete = () => {
    deleteSite()
    setShowConfirmation(false)
    navigate('/browse/site')
  }

  function handleDeletePrompt() {
    setShowConfirmation(true)
  }

  const isError = !isPristine && (isEmpty(editSite.name) || isEmpty(editSite.shortName) || isEmpty(editSite.countryId))

  return (
    <div>
      <section className={cssClasses('Section', 'Section--first')}>
        <Card className={cssClasses('Section__Content')}>
          <div className={cssClasses('container')}>
            <TextField
              className={cssClasses('container__field')}
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
              className={cssClasses('container__field')}
              name="shortName"
              label={formatMessage(messages.fieldShortName)}
              margin="normal"
              fullWidth
              value={editSite.shortName}
              onChange={e => setEditSite({ ...editSite, shortName: e.target.value })}
              error={!isPristine && isEmpty(editSite.shortName)}
              helperText={
                !isPristine && isEmpty(editSite.name) && `${formatMessage(messages.fieldShortName)} is required`
              }
            />
            <TextField
              className={cssClasses('container__field')}
              name="externalId"
              label={formatMessage(messages.fieldExternalId)}
              margin="normal"
              fullWidth
              value={editSite.externalId || ''}
              onChange={e => setEditSite({ ...editSite, externalId: e.target.value })}
            />
          </div>
          <div className={cssClasses('container')}>
            <SiteTypeSelect
              name="siteType"
              width="33%"
              label={formatMessage(messages.fieldSiteType)}
              value={editSite.siteTypeId}
              onChange={siteTypeId => setEditSite({ ...editSite, siteTypeId })}
            />
            <TextField
              className={cssClasses('container__field')}
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
              className={cssClasses('container__field')}
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
          <div className={cssClasses('container')}>
            <LocationSelector
              user={user}
              countryId={editSite.countryId || ''}
              stateId={editSite.stateId || ''}
              lgaId={editSite.lgaId || ''}
              validators={{ country: { error: !isPristine && isEmpty(editSite.countryId), helperText: 'is required' } }}
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
          <div className={cssClasses('container')}>
            <TextField
              className={cssClasses('container__field')}
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
              className={cssClasses('container__field')}
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
              width="33%"
              label={formatMessage(messages.fieldBelongTo)}
              value={editSite.parentWarehouseId || ''}
              onChange={parentWarehouseId => setEditSite({ ...editSite, parentWarehouseId })}
              queryParams={queryParamsForWarehouse}
            />
          </div>
          <div className={cssClasses('container', 'coordinate')}>
            <TextField
              className={cssClasses('container__field')}
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
              className={cssClasses('container__field')}
              name="latitude"
              label={formatMessage(messages.fieldLatitude)}
              margin="normal"
              fullWidth
              value={editSite.latitude}
              onChange={e => {
                setEditSite({ ...editSite, latitude: e.target.value })
              }}
            />
            <div className={cssClasses('coordinate__button')}>
              <AspectButton
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
              </AspectButton>
            </div>
          </div>
          <div className={cssClasses('container')}>
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
          {isNew ? null : (
            <div className={cssClasses('container')}>
              <ReadOnlyField
                label={formatMessage(messages.fieldTags)}
                value={siteTags}
                format={v => <SiteTagInput qryId={editSite.id} onTagChange={tags => updateTags(tags)} value={v} />}
              />
            </div>
          )}
          <div className={cssClasses('container', 'coordinate')}>
            <TextField
              label={formatMessage(messages.fieldNotes)}
              multiline
              rows={4}
              fullWidth
              defaultValue={editSite.notes}
              onChange={e => setEditSite({ ...editSite, notes: e.target.value })}
            />
          </div>
          <Button color="secondary" variant="contained" onClick={handleSubmit} disabled={isPristine || isError}>
            {isNew ? formatMessage(messages.buttonCreate) : formatMessage(messages.buttonUpdate)}
          </Button>
          {isNew ? null : (
            <PermissionsProvider permissions={['site:admin']}>
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
            </PermissionsProvider>
          )}

          <Button
            style={{ marginLeft: '1rem' }}
            type="button"
            variant="contained"
            onClick={() => navigate('/browse/site')}
          >
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
    </div>
  )
}

SiteForm.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  site: PropTypes.object,
  siteTags: PropTypes.arrayOf(PropTypes.object),
  onLatLongChange: PropTypes.func,
}
SiteForm.defaultProps = {
  siteTags: [],
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
