import React from 'react'
import { Helmet } from 'react-helmet'

const SignedOutLayout = ({ children }) => {
  return (
    <div>
      <Helmet titleTemplate="%s - Aspect" defaultTitle="Aspect" />
      {children}
    </div>
  )
}
export default SignedOutLayout
