import React, { useContext, useEffect, useState } from 'react'
import { useFormikContext } from 'formik'

export const DirtyStepsContext = React.createContext(undefined)

export const DirtyStepsProvider = props => {
  const [dirtySteps, setDirtySteps] = useState({})
  return <DirtyStepsContext.Provider value={{ dirtySteps, setDirtySteps }}>{props.children}</DirtyStepsContext.Provider>
}

export const DirtyListener = ({ step }) => {
  const { setDirtySteps } = useContext(DirtyStepsContext)
  const { dirty, isSubmitting } = useFormikContext()
  useEffect(
    () =>
      setDirtySteps(prv => ({
        ...prv,
        [step]: isSubmitting ? false : dirty,
      })),
    [dirty, isSubmitting, setDirtySteps, step]
  )
  return null
}
