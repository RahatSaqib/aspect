/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector, useDispatch, shallowEqual } from 'react-redux'
import { FaNotesMedical } from 'react-icons/fa'
import CircularProgress from '@material-ui/core/CircularProgress'
import isEqual from 'lodash/isEqual'

import usePrevious from '../../../Hooks/CustomHooks'
import { fetchResultsDetail } from './Redux/resultsDetail'
import { fetchResultsForm } from './Redux/resultsForm'
import { FormikProvider } from '../../Form/Formik/Context'
import { mergeFormConfigWithData } from '../../Form/Formik/Helpers'

import AspectForm from '../../Form'
import FormActions from '../../Form/formActions'
import Shell from '../Shell'
import ShellHeader from '../Shell/Header'
import ShellContent from '../Shell/Content'
import ShellFooter from '../Shell/Footer'

const AspectResultDetail = ({ match }) => {
  const { params } = match
  const { resultId } = params
  const dispatch = useDispatch()
  const [formConfig, setFormConfig] = useState(false)
  const { formSchema, formData } = useSelector(
    ({ resultsForm, resultsDetail }) => ({
      ...resultsForm.toJS(),
      ...resultsDetail.toJS(),
    }),
    shallowEqual
  )
  const prevResultId = usePrevious(resultId)
  const prevFormConfig = usePrevious(formConfig)
  const prevFormSchema = usePrevious(formSchema)
  const prevFormData = usePrevious(formData)

  // console.log(resultId)
  // console.log(formConfig)
  // console.log(formSchema)
  // console.log(formData)

  useEffect(() => {
    if (resultId || !isEqual(resultId, prevResultId)) {
      console.log(
        formSchema,
        prevFormSchema,
        isEqual(formSchema, prevFormSchema)
      )

      if (!formSchema || !isEqual(formSchema, prevFormSchema)) {
        console.log('dispatch form')

        dispatch(fetchResultsForm())
      }
      if (resultId !== 'add') {
        console.log('dispatch data')
        dispatch(fetchResultsDetail(resultId))
      }
    }
  }, [resultId])

  useEffect(() => {
    // if (formSchema && !isEqual(formSchema, prevFormSchema)) {
    //   console.log(
    //     formSchema,
    //     prevFormSchema,
    //     !isEqual(formSchema, prevFormSchema),
    //     formData,
    //     formSchema
    //   )
    //   if (resultId === 'add') {
    //     setFormConfig(mergeFormConfigWithData({}, formSchema))
    //   }
    //   if (resultId !== 'add' && formData && formSchema) {
    //     console.log(formData)
    //     setFormConfig(mergeFormConfigWithData(formData, formSchema))
    //   }
    // }
    if (formData && formSchema && resultId !== 'add') {
      console.log('all arrived, should be update')
    }
    if (!formData && formSchema && resultId === 'add') {
      console.log('all arrived, should be create')
    }
  }, [formSchema, formData])

  // useEffect(() => {
  //   // if (!isEqual(params, prevParams) && !isEqual(formConfig, prevFormConfig)) {
  //   console.log(resultId === 'add')
  //   console.log(params, prevParams, !isEqual(params, prevParams))
  //   console.log(
  //     formSchema,
  //     prevFormSchema,
  //     !isEqual(formSchema, prevFormSchema)
  //   )

  //   if (resultId === 'add' && !isEqual(params, prevParams)) {
  //     dispatch(fetchResultsForm())
  //     // dispatch(fetchResultsDetail(resultId))
  //   }

  //   if (resultId !== 'add' && !isEqual(params, prevParams)) {
  //     dispatch(fetchResultsForm())
  //     dispatch(fetchResultsForm(resultId))
  //   }
  //   // if(resultId && !isEqual(params, prevParams) && !isEqual(formConfig, prevFormConfig))
  //   // }
  //   // }
  // }, [params, formConfig])

  // useEffect(() => {
  //   // if (resultId === 'add' && !isEqual(formSchema, prevFormSchema)) {
  //   //   setFormConfig(mergeFormConfigWithData({}, formSchema));
  //   // }
  //   console.log(formConfig, !formConfig)

  //   console.log(
  //     formConfig,
  //     prevFormConfig,
  //     !isEqual(formConfig, prevFormConfig)
  //   )

  //   if (!formConfig || !isEqual(formConfig, prevFormConfig)) {
  //     if (resultId === 'add' && formSchema) {
  //       setFormConfig(mergeFormConfigWithData({}, formSchema))
  //     }

  //     if (resultId !== 'add' && formSchema && formData) {
  //       setFormConfig(mergeFormConfigWithData(formData, formSchema))
  //     }
  //   }
  // }, [formConfig, formSchema, formData])

  console.log(formConfig, formData)

  return (
    <Shell>
      {formConfig && false ? (
        <FormikProvider config={formConfig}>
          <ShellHeader icon={FaNotesMedical} title={formConfig.title}>
            <FormActions config={formConfig} />
          </ShellHeader>
          <ShellContent>
            <AspectForm config={formConfig} />
          </ShellContent>
          <ShellFooter />
        </FormikProvider>
      ) : (
        <CircularProgress />
      )}
    </Shell>
  )
}

export default AspectResultDetail
