import React from 'react'
import isEmpty from 'lodash/isEmpty'
import { useParams, useLocation, matchPath } from 'react-router-dom'
import DetailBackBar from '../../../oldComponents/DetailBackBar'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import messages from './messages'

const PersonDetailBackBar = ({ canLogIn = false, formatMessage, navigate, title, disabled }) => {
  const params = useParams()
  const location = useLocation()

  const onBackClick = () => {
    navigate(`/browse/person?filters=contactStatus%3D0`)
  }
  const onPathClick = path => {
    navigate({
      pathname: path.replace(/:([A-Za-z]+)/g, ($, key) => params[key]),
    })
  }
  return (
    <DetailBackBar onBackClick={onBackClick} title={title}>
      {[
        {
          label: formatMessage(messages.contactDetails),
          path: `/browse/person/:personId`,
          enabled: true,
        },
        {
          label: formatMessage(messages.systemAccessControl),
          path: `/browse/person/:personId/system-access-control`,
          enabled: canLogIn,
        },
        {
          label: formatMessage(messages.jobAssignment),
          path: `/browse/person/:personId/job-assignment`,
          enabled: canLogIn,
        },
      ].map(({ label, path, enabled }) => {
        return enabled ? (
          <AspectButton
            key={path}
            onClick={({
              currentTarget: {
                dataset: { path },
              },
            }) => onPathClick(path)}
            disabled={disabled}
            data-path={path}
            color="primary"
            variant="contained"
            inverse={isEmpty(matchPath({ path }, location.pathname))}
          >
            {label}
          </AspectButton>
        ) : null
      })}
    </DetailBackBar>
  )
}

export default PersonDetailBackBar
