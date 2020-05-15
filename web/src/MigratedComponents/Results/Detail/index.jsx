import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import classnames from 'classnames/bind'
import { FaNotesMedical } from 'react-icons/fa'
import isEqual from 'lodash/isEqual'
import CircularProgress from '@material-ui/core/CircularProgress'
import { fetchSingleResult } from './Redux'

import { mergeFormConfigWithData } from '../../Form/Formik/Helpers'

import AspectForm from '../../Form'
import Shell from '../Shell'
import ShellHeader from '../Shell/Header'
import ShellContent from '../Shell/Content'
import ShellFooter from '../Shell/Footer'

const cssClasses = classnames.bind(require('../Shell/Shell.css'))

const resultsConfig = {
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
          label: 'Site',
          id: 'siteName',
          key: 'siteName',
          input: {
            type: 'text',
            component: 'textField',
          },
        },
      ],
    },
    // {
    //   id: 'assay',
    //   header: 'Assay',
    //   items: [
    //     {
    //       label: 'Assay Type',
    //       id: 'assay.name',
    //       key: 'assay.name',
    //       input: {
    //         type: 'text',
    //         component: 'textField',
    //       },
    //       type: 'text',
    //     },
    //   ],
    // },
  ],
}

const AspectResultDetail = ({ match }) => {
  const dispatch = useDispatch()
  const [singleResult, setSingleResult] = useState(false)
  const [formConfig, setFormConfig] = useState(false)
  const { id, name, actions, sections } = formConfig
  const { params } = match

  const data = useSelector(({ currentCase }) => {
    const { item = false } = currentCase.toJS()
    return item
  })

  useEffect(() => {
    if (singleResult) {
      setFormConfig(mergeFormConfigWithData(singleResult, resultsConfig))
    }
  }, [singleResult])

  useEffect(() => {
    if (!data && params) {
      const { resultId } = params
      dispatch(fetchSingleResult(resultId))
    } else if (
      (data && !singleResult) ||
      (singleResult && !isEqual(data, singleResult))
    ) {
      setSingleResult(data)
    }
  }, [data])

  return (
    <Shell>
      <ShellHeader icon={FaNotesMedical} title="New Header Title">
        {actions && actions.map(({ type }) => <div>{type}</div>)}
      </ShellHeader>
      <ShellContent>
        {formConfig ? <AspectForm config={formConfig} /> : <CircularProgress />}
      </ShellContent>
      <ShellFooter />
    </Shell>
  )
}

export default AspectResultDetail
