import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'
import merge from 'lodash/merge'
import Grid from '@material-ui/core/Grid'
import AspectCard from '../../../AspectCard'
import GraphRender from '../../GraphRender'
import CardSelectors from '../../CardSelectors'

import { fetchClinicalIndicatorsDashboard } from '../../GraphRender/Redux'
import {
  extractOptionValue,
  validateGraphConfig,
} from '../../Helpers/Formatters'
import messages from '../messages'

const cssClasses = classnames.bind(require('../GraphsContainer.css'))

const GraphContainer = ({ config, size, assaysFromState }) => {
  const dispatch = useDispatch()
  const tempDispatchParams = []
  const { title, selectorModifiers = false } = config
  const { formatMessage: intlFormatMessage } = useIntl()
  const { assays, graphType, id } = config
  const { innerSize, outerSize } = size
  const [dispatchParams, setDispatchParams] = useState(false)
  const [dispatchFromChild, setDispatchFromChild] = useState(false)
  const [dispatchParamsFromChild, setDispatchParamsFromChild] = useState(false)
  const [dispatchFromSelector, setdispatchFromSelector] = useState(false)
  const [whiteListed, setwhiteListed] = useState(false)

  useEffect(() => {
    const allowed = []
    validateGraphConfig(config).then(() => {
      assays.map(a =>
        assaysFromState.filter(
          ({ externalId, hasResults }) =>
            externalId === a && hasResults && allowed.push(a)
        )
      )
      setwhiteListed(allowed)
    })
  }, [config, assays, assaysFromState])

  useEffect(() => {
    if (dispatchFromChild && dispatchFromSelector) {
      const base = dispatchParams || dispatchFromChild
      const { api } = base
      const { params } = api
      const { identifier, selectedOption } = dispatchFromSelector
      const optionValue = extractOptionValue(identifier, selectedOption)
      const mergedAPI = {
        ...base,
        api: { ...api, params: { ...merge(params, optionValue) } },
      }
      dispatch(fetchClinicalIndicatorsDashboard(mergedAPI))
    }
  }, [dispatchFromSelector])

  useEffect(() => {
    if (dispatchParamsFromChild) {
      dispatchParamsFromChild.map(dParams => {
        const { graphState } = dParams
        setDispatchFromChild(dParams)
        if (dParams && graphState === false) {
          dispatch(fetchClinicalIndicatorsDashboard({ ...dParams }))
        }
        return true
      })
    }
  }, [dispatchParamsFromChild])

  return whiteListed && whiteListed.length ? (
    <Grid item xs={12} lg={outerSize}>
      <Grid container spacing={24}>
        <Grid item xs={12}>
          <AspectCard
            title={intlFormatMessage(messages[title])}
            innerSize={innerSize}
            justify="center"
            action={params => setdispatchFromSelector({ ...params })}
            actionComponent={{
              component: CardSelectors,
              props: selectorModifiers,
            }}
          >
            <Grid
              container
              spacing={8}
              className={cssClasses('graph__containerGrid')}
            >
              {graphType &&
                graphType.map(graph => (
                  <GraphRender
                    assays={{ whiteListed, assaysFromState }}
                    config={graph}
                    id={id}
                    action={params => {
                      tempDispatchParams.push(params)
                      setDispatchParamsFromChild(tempDispatchParams)
                    }}
                  />
                ))}
            </Grid>
          </AspectCard>
        </Grid>
      </Grid>
    </Grid>
  ) : null
}

GraphContainer.protoTypes = {
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  size: PropTypes.oneOfType([PropTypes.object]).isRequired,
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
}

export default GraphContainer
