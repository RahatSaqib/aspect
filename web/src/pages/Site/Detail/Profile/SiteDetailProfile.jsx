import React from 'react'
import { Card } from '@mui/material'
import classnames from 'classnames/bind'
import PropTypes from 'prop-types'
import useContactBySite from '../../../../hooks/person/useContactBySite'
import { getCustomMessage, commonDefinitions } from '../../../../messages/customMessages'
import Summary from '../../../../oldComponents/Summary'
import Contacts from '../Contacts/Contacts'
import localMessages from '../messages'
import styles from '../SiteDetail.css'

const cssClasses = classnames.bind(styles)

const messages = { ...commonDefinitions, ...localMessages }

const SiteDetailProfile = ({ site, formatMessage, disabled, user }) => {
  const { data: siteContacts } = useContactBySite(site.id)

  const fields = [
    { label: formatMessage(messages.fieldName), value: site.name },
    { label: formatMessage(messages.fieldShortName), value: site.shortName },
    { label: formatMessage(messages.fieldExternalId), value: site.externalId },
    {
      label: formatMessage(messages.fieldAddress),
      value: (
        <div>
          <p>{site.street1}</p>
          <p>{site.street2}</p>
          <p>{site.zip}</p>
        </div>
      ),
    },
    { label: getCustomMessage(messages, 'state', user), value: site.state },
    { label: getCustomMessage(messages, 'lga', user), value: site.lga },
    { label: formatMessage(messages.fieldCity), value: site.city },
    {
      label: formatMessage(messages.fieldDevices),
      value:
        site.devices &&
        site.devices.map(device => ({
          description: device.name,
          to: `/browse/device/list/${device.id}`,
        })),
    },
    { label: formatMessage(messages.fieldTags), value: site?.tags.map(tag => tag.title).join(', ') },
  ]
  return (
    <div>
      <section className={cssClasses('Section', 'Section--first')}>
        <Card className={cssClasses('Section__Content')}>
          {fields.map(({ label, value }) => (
            <Summary key={`${label}_${site.id}`} title={label} description={value || ''} cols="4" />
          ))}

          <Contacts
            id={site.id}
            formatMessage={formatMessage}
            title={formatMessage(messages.fieldContact)}
            contacts={siteContacts || []}
            disabled={disabled}
          />
        </Card>
      </section>
    </div>
  )
}

SiteDetailProfile.defaultProps = {}

SiteDetailProfile.propTypes = {
  formatMessage: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  site: PropTypes.object.isRequired,
  disabled: PropTypes.bool.isRequired,
  user: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default SiteDetailProfile
