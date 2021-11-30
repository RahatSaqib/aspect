import React from 'react'
import { useParams } from 'react-router-dom'
import messages from './messages'
import DetailBackBar from '../../globals/components/DetailBackBar'
import AspectButton from '../../components/shared/AspectButton'

const PersonDetailBackBar = ({
  formatMessage,
  canUserLoggedIn = true,
  navigate,
  location,
  title,
  isNew,
  disabled,
}) => {
  const params = useParams()
  const onBackClick = () => {
    navigate(`/browse/person`)
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
        },
        {
          label: formatMessage(messages.systemAccessControl),
          path: `/browse/person/:personId/system-access-control`,
        },
        {
          label: formatMessage(messages.jobAssignment),
          path: `/browse/person/:personId/job-assignment`,
          disabled,
        },
      ].map(({ label, path, disabled = false }) => {
        if (
          (!canUserLoggedIn &&
            [formatMessage(messages.systemAccessControl)].includes(label)) ||
          isNew
        ) {
          return null
        }

        return (
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
            inverse={location.pathname !== path && !disabled}
          >
            {label}
          </AspectButton>
        )
      })}
    </DetailBackBar>
  )
}

export default PersonDetailBackBar
