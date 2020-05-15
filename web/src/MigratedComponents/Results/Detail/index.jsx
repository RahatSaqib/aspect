import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import classnames from 'classnames/bind'
import { FaNotesMedical } from 'react-icons/fa'

import { fetchSingleResult } from './Redux'
import usePrev from '../../../Hooks/CustomHooks'

import AspectForm from '../../Form'
import Shell from '../Shell'
import ShellHeader from '../Shell/Header'
import ShellContent from '../Shell/Content'
import ShellFooter from '../Shell/Footer'

const cssClasses = classnames.bind(require('../Shell/Shell.css'))

const formConfig = {
  id: 'Results',
  name: 'Results',
  actions: [
    {
      type: 'edit',
      label: 'Edit Result',
      action: () => console.log('edit!'),
    },
    {
      type: 'cancel',
      label: 'Cancel',
      action: () => console.log('cancel!'),
    },
  ],
  sections: [
    {
      id: 'lab',
      header: 'Lab',
      items: [
        {
          id: 'name',
          label: 'Lab Name',
        },
        {
          id: 'serial',
          label: 'Lab serial',
        },
        {
          id: 'name',
          label: 'Lab Name',
        },
        {
          id: 'serial',
          label: 'Lab serial',
        },
        {
          id: 'name',
          label: 'Lab Name',
        },
        {
          id: 'serial',
          label: 'Lab serial',
        },
        {
          id: 'name',
          label: 'Lab Name',
        },
        {
          id: 'serial',
          label: 'Lab serial',
        },
        {
          id: 'name',
          label: 'Lab Name',
        },
        {
          id: 'serial',
          label: 'Lab serial',
        },
        {
          id: 'name',
          label: 'Lab Name',
        },
        {
          id: 'serial',
          label: 'Lab serial',
        },
      ],
    },
    {
      id: 'assay',
      header: 'Assay',
      items: [
        {
          id: 'type',
          label: 'Assay Type',
        },
      ],
    },
  ],
}

const AspectResultDetail = () => {
  const dispatch = useDispatch()
  const [singleResult, setSingleResult] = useState(false)
  const prevSingleResult = usePrev(singleResult)
  const { id, name, actions, sections } = formConfig

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
        {actions && actions.map(({ type }) => <div>{type}</div>)}
      </ShellHeader>
      <ShellContent>
        <AspectForm sections={sections} />
      </ShellContent>
      <ShellFooter />
    </Shell>
  )
}

export default AspectResultDetail
