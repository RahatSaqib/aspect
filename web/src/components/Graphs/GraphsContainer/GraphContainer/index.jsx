import React, { useState } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames/bind'
import Grid from '@mui/material/Grid'

import AspectCard from '../../../AspectCard'
import GraphRender from '../../GraphRender'
import CardSelectors from '../../CardSelectors'
import PermissionsProvider from '../../../../providers/PermissionsProvider'

import GRAPH_CONSTS from '../../../../globals/consts/Graphs/CONSTS'
import { extractOptionValue } from '../../Helpers/Formatters'
import messages from '../messages'
import styles from '../GraphsContainer.css'
import useI18n from '../../../../hooks/useI18n'

const cssClasses = classnames.bind(styles)

const GraphContainer = ({ assaysFromState, classNames, config, size, whiteListed }) => {
  const { title, id, selectorModifiers = false, isOwnerReady = true } = config
  const { formatMessage: intlFormatMessage } = useI18n()
  const { graphType, graphRenderPermissions } = config
  const { innerSize, outerSize } = size
  const { identifier, isClientSide, component: ClientSideFilter } = selectorModifiers[0] || false
  const [graphParams, setGraphParams] = useState(false)
  const [clientSideFilters, setClientSideFilters] = useState(false)
  const [clientSideFilterOptions, setClientSideFilterOptions] = useState(false)
  const permissions = whiteListed ? [...whiteListed, ...graphRenderPermissions] : graphRenderPermissions

  const updateFromActionComponent = ({ identifier, selectedOption }) =>
    setGraphParams(extractOptionValue(identifier, selectedOption))

  const updateGraphClientSide = props => {
    setClientSideFilters(props)
  }

  return (
    <PermissionsProvider permissions={permissions}>
      <Grid item xs={12} lg={outerSize}>
        <Grid container>
          <Grid item xs={12}>
            <AspectCard
              title={intlFormatMessage(messages[title])}
              innerSize={innerSize}
              justify="center"
              action={params =>
                isClientSide ? updateGraphClientSide(params) : updateFromActionComponent({ ...params })
              }
              actionComponent={
                isClientSide
                  ? {
                      component: ClientSideFilter,
                      props: {
                        selectorModifiers,
                        data: clientSideFilterOptions,
                      },
                    }
                  : {
                      component: CardSelectors,
                      props: selectorModifiers,
                    }
              }
              name={id}
              classNames={classNames}
            >
              <Grid container spacing={8} className={cssClasses('graph__containerGrid')}>
                {graphType &&
                  graphType.map(graph => {
                    const { api: { params: { flags = [] } = {} } = {} } = graph
                    const optionalProps = { isOwnerReady }
                    if (flags.includes(GRAPH_CONSTS.GET_TOTAL_RESULTS)) {
                      optionalProps.onSettled = config.onSettled
                    }

                    return (
                      <GraphRender
                        assays={{ whiteListed, assaysFromState }}
                        config={graph}
                        key={graph.id}
                        id={graph.id}
                        updatedParams={graphParams}
                        formatMessage={intlFormatMessage}
                        clientSideFilter={{
                          identifier,
                          isClientSide,
                          selectorModifiers,
                          clientSideFilters,
                          clientSideFilterOptions,
                          setClientSideFilterOptions,
                        }}
                        {...optionalProps}
                      />
                    )
                  })}
              </Grid>
            </AspectCard>
          </Grid>
        </Grid>
      </Grid>
    </PermissionsProvider>
  )
}

GraphContainer.protoTypes = {
  assaysFromState: PropTypes.oneOfType([PropTypes.array]).isRequired,
  config: PropTypes.oneOfType([PropTypes.object]).isRequired,
  size: PropTypes.oneOfType([PropTypes.object]).isRequired,
}

export default GraphContainer
