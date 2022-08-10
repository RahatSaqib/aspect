import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Card from '@mui/material/Card'

import Contacts from '../Contacts/Contacts'
import localMessages from '../messages'
import { Site } from '../../../../store/SiteRedux'
import Summary from '../../../../oldComponents/Summary'
import { getCustomMessage, commonDefinitions } from '../../../../utils/utils/customMessages'

import styles from '../SiteDetail.css'

const cssClasses = classnames.bind(styles)

const messages = {
  ...commonDefinitions,
  ...localMessages,
}

const SiteDetailProfile = ({ site, siteTags, siteContacts, formatMessage, disabled, user }) => {
  const fields = [
    {
      label: formatMessage(messages.fieldName),
      value: site.get('name'),
    },
    {
      label: formatMessage(messages.fieldShortName),
      value: site.get('shortName'),
    },
    {
      label: formatMessage(messages.fieldExternalId),
      value: site.get('externalId'),
    },
    {
      label: formatMessage(messages.fieldAddress),
      value: (
        <div>
          <p>{site.get('street1')}</p>
          <p>{site.get('street2')}</p>
          <p>{site.get('zip')}</p>
        </div>
      ),
    },
    {
      label: getCustomMessage(messages, 'state', user),
      value: site.get('state'),
    },
    {
      label: formatMessage(messages.fieldCity),
      value: site.get('city'),
    },
    {
      label: getCustomMessage(messages, 'lga', user),
      value: site.get('lga'),
    },
    {
      label: formatMessage(messages.fieldDevices),
      value:
        site.get('devices') &&
        site
          .get('devices')
          .toJS()
          .map(device => ({
            description: device.name,
            to: device.category === 2 ? '/browse/router' : `/browse/device/${device.id}`,
          })),
    },
    {
      label: formatMessage(messages.fieldTags),
      value: siteTags.map(tag => tag.title).join(', '),
    },
  ]
  return (
    <div>
      <section className={cssClasses('Section', 'Section--first')}>
        <Card className={cssClasses('Section__Content')}>
          {fields.map(({ label, value }) => (
            <Summary
              key={`${label}_${site.get('id')}`}
              title={label}
              // `description` is marked as required in Summary
              description={value || ''}
              cols="4"
            />
          ))}

          <Contacts
            id={site.get('id')}
            formatMessage={formatMessage}
            title={formatMessage(messages.fieldContact)}
            contacts={siteContacts}
            disabled={disabled}
          />
        </Card>
      </section>
    </div>
  )
}

SiteDetailProfile.defaultProps = {
  siteTags: [],
  siteContacts: [],
}

SiteDetailProfile.propTypes = {
  formatMessage: PropTypes.func.isRequired,
  site: PropTypes.objectOf(Site).isRequired,
  disabled: PropTypes.bool.isRequired,
  siteTags: PropTypes.arrayOf(PropTypes.object),
  siteContacts: PropTypes.arrayOf(PropTypes.object),
  user: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default SiteDetailProfile
