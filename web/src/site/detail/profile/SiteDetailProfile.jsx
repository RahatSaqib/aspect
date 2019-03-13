import PropTypes from 'prop-types'
// Imports from packages
import React from 'react'
import classnames from 'classnames/bind'
import Card from '@material-ui/core/Card'

// Our own imports
import messages from '../messages'
import { Site } from '../../SiteRedux'
import Summary from '../../../globals/components/Summary'
import SiteDetailBackBar from '../SiteDetailBackBar'

const cssClasses = classnames.bind(require('../SiteDetail.css'))

const SiteDetailProfile = ({
  site,
  siteTags,
  formatMessage,
  history,
  location,
  match,
  disabled,
}) => {
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
      label: formatMessage(messages.fieldState),
      value: site.get('state'),
    },
    {
      label: formatMessage(messages.fieldCity),
      value: site.get('city'),
    },
    {
      label: formatMessage(messages.fieldLGA),
      value: site.get('lga'),
    },
    {
      label: formatMessage(messages.fieldContact),
      value:
        site.get('contacts') &&
        site
          .get('contacts')
          .toJS()
          .map(contact => ({
            description: contact.name,
            to: `/browse/person/${contact.id}`,
          })),
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
            to:
              device.category === 2
                ? '/browse/router'
                : `/browse/device?filters=deviceTypeId%3D${device.id}`,
          })),
    },
    {
      label: formatMessage(messages.fieldTags),
      value: siteTags.map(tag => tag.title).join(', '),
    },
  ]
  return (
    <div>
      {site && (
        <SiteDetailBackBar
          formatMessage={formatMessage}
          history={history}
          location={location}
          match={match}
          title={site.get('name')}
          disabled={disabled}
        />
      )}
      <section className={cssClasses('Section', 'Section--first')}>
        <Card className={cssClasses('Section__Content')}>
          {fields.map(field => (
            <Summary title={field.label} description={field.value} cols="4" />
          ))}
        </Card>
      </section>
    </div>
  )
}

SiteDetailProfile.defaultProps = {
  siteTags: [],
}

SiteDetailProfile.propTypes = {
  formatMessage: PropTypes.func.isRequired,
  site: PropTypes.objectOf(Site).isRequired,
  history: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  location: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  match: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  disabled: PropTypes.bool.isRequired,
  siteTags: PropTypes.arrayOf(PropTypes.object),
}

export default SiteDetailProfile
