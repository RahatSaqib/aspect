import React from 'react'
import messages from './messages'
import DetailBackBar from '../../globals/components/DetailBackBar'
import AspectButton from '../../components/shared/AspectButton'

const AccountDetailsBackBar = ({
  formatMessage,
  history,
  location,
  match,
  title,
}) => {
  const onBackClick = () => {
    // go to home page - routerFactory will redirect to either /dashboard, /operational-data or /browse
    history.push('/')
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
          label: formatMessage(messages.title),
          path: `/account-details/current`,
        },
        {
          label: formatMessage(messages.usernameAndPassword),
          path: `/account-details/current/system-access-control`,
        },
      ].map(({ label, path, disabled = false }) => (
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
      ))}
    </DetailBackBar>
  )
}

export default AccountDetailsBackBar
