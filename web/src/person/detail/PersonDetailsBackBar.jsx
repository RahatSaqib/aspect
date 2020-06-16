import React from 'react'
import messages from './messages'
import DetailBackBar from '../../globals/components/DetailBackBar'
import AspectButton from '../../components/shared/AspectButton'

const PersonDetailBackBar = ({
  formatMessage,
  canUserLoggedIn = true,
  history,
  location,
  match,
  title,
  isNew,
  disabled,
}) => {
  const onBackClick = () => {
    history.goBack()
  }
  const onPathClick = path => {
    history.push({
      pathname: path.replace(/:([A-Za-z]+)/g, ($, key) => match.params[key]),
    })
  }
  return (
    <DetailBackBar
      history={history}
      location={location}
      match={match}
      onBackClick={onBackClick}
      title={title}
    >
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
            [
              formatMessage(messages.systemAccessControl),
              formatMessage(messages.jobAssignment),
            ].includes(label)) ||
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
            inverse={match.path !== path && !disabled}
          >
            {label}
          </AspectButton>
        )
      })}
    </DetailBackBar>
  )
}

export default PersonDetailBackBar
