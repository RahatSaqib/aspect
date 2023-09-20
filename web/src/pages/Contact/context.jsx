import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useFormikContext } from 'formik'
import { useLocation, useParams } from 'react-router-dom'
import { useAuthState } from '../../providers/AuthProvider'
import ACTION from './constants'

export const DirtyStepsContext = React.createContext(undefined)

export const FormStatusContext = React.createContext(undefined)

export const FormStatusProvider = props => {
  const { personId } = useParams()
  const { personId: loggedInPersonId } = useAuthState()
  const { search } = useLocation()
  const isRecentlyAdd = useMemo(() => new URLSearchParams(search).get('add'), [search])
  const id = useMemo(
    () =>
      personId
        ? personId === loggedInPersonId
          ? ACTION.SELF
          : personId !== ACTION.ADD
          ? personId
          : ACTION.ADD
        : ACTION.SELF,
    [loggedInPersonId, personId]
  )

  const isAdding = useMemo(() => id === ACTION.ADD || isRecentlyAdd, [id, isRecentlyAdd])

  return (
    <FormStatusContext.Provider value={{ id, isRecentlyAdd, isAdding }}>{props.children}</FormStatusContext.Provider>
  )
}

export const DirtyStepsProvider = props => {
  const [dirtySteps, setDirtySteps] = useState({})
  return <DirtyStepsContext.Provider value={{ dirtySteps, setDirtySteps }}>{props.children}</DirtyStepsContext.Provider>
}

export const DirtyListener = ({ step }) => {
  const { setDirtySteps } = useContext(DirtyStepsContext)
  const { dirty } = useFormikContext()

  useEffect(
    () =>
      setDirtySteps(prv => ({
        ...prv,
        [step]: dirty,
      })),
    [dirty, setDirtySteps, step]
  )
  return null
}
