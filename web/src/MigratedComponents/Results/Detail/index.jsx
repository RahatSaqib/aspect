import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'
import Card from '@material-ui/core/Card'
import { FaNotesMedical } from 'react-icons/fa'

import { fetchSingleResult } from './Redux'
import usePrev from '../../../Hooks/CustomHooks'

import Shell from '../Shell'
import ShellHeader from '../Shell/Header'
import ShellContent from '../Shell/Content'
import ShellFooter from '../Shell/Footer'

const cssClasses = classnames.bind(require('../Shell/Shell.css'))

const AspectResultDetail = () => {
  const dispatch = useDispatch()
  const [singleResult, setSingleResult] = useState(false)
  const prevSingleResult = usePrev(singleResult)

  const data = useSelector(({ currentCase }) => {
    const { item = false } = currentCase.toJS()
    return item
  })

  useEffect(() => {
    if (data && !singleResult) {
      // if ((data && !singleResult) || (prevSingleResult !== singleResult)) {
      setSingleResult(data)
    }
  }, [data, singleResult])

  useEffect(() => {
    if (!data) {
      dispatch(fetchSingleResult(13720))
    }
  })

  console.log(prevSingleResult, singleResult, prevSingleResult === singleResult)

  return (
    <Shell>
      <ShellHeader icon={FaNotesMedical} title="New Header Title">
        <div className={cssClasses('shell__headerActions')}>Actions!</div>
      </ShellHeader>
      <ShellContent>content</ShellContent>
      <ShellFooter />
    </Shell>
  )
}

export default AspectResultDetail
