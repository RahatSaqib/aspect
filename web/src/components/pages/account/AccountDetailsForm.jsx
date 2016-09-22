import React from 'react'

const AccountDetailsForm = props => {
  const {accountDetails} = props

  return (
    <div>
      Username: {accountDetails.get('username')}
      <br/>
      Full Name: {accountDetails.get('name')}
    </div>
  )
}

export default AccountDetailsForm
