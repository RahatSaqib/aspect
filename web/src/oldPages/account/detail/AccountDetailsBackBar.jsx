import React from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import DetailBackBar from '../../../oldComponents/DetailBackBar'
import AspectButton from '../../../oldComponents/shared/AspectButton'
import messages from './messages'

const AccountDetailsBackBar = ({ formatMessage, title }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const onBackClick = () => {
    // go to home page - routerFactory will redirect to either /dashboard, /operational-data or /browse
    navigate('/')
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
          inverse={location.pathname !== path && !disabled}
        >
          {label}
        </AspectButton>
      ))}
    </DetailBackBar>
  )
}

export default AccountDetailsBackBar
