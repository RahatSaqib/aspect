import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import classnames from 'classnames/bind'
import Grid from '@material-ui/core/Grid'

import AspectCard from '../../../AspectCard'
import GraphRender from '../../GraphRender'
import CardSelectors from '../../CardSelectors'
import PermissionsProvider from '../../../../Providers/PermissionsProvider'

import { extractOptionValue } from '../../Helpers/Formatters'
import messages from '../messages'
import styles from '../GraphsContainer.css'

const cssClasses = classnames.bind(styles)

const GraphContainer = ({ config, size, assaysFromState, whiteListed }) => {
  const { title, id, selectorModifiers = false } = config
  const { formatMessage: intlFormatMessage } = useIntl()
  const { graphType, graphRenderPermissions } = config
  const { innerSize, outerSize } = size
  const { isClientSide, component: ClientSideFilter } =
    selectorModifiers[0] || false
  const [graphParams, setGraphParams] = useState(false)
  const [clientSideFilters, setClientSideFilters] = useState(false)
  const [clientSideFilterOptions, setClientSideFilterOptions] = useState(false)
  const permissions = whiteListed
    ? [...whiteListed, ...graphRenderPermissions]
    : graphRenderPermissions

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
                isClientSide
                  ? updateGraphClientSide(params)
                  : updateFromActionComponent({ ...params })
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
                      key={graph.id}
                      id={graph.id}
                      updatedParams={graphParams}
                      formatMessage={intlFormatMessage}
                      clientSideFilter={{
                        isClientSide,
                        selectorModifiers,
                        clientSideFilters,
                        clientSideFilterOptions,
                        setClientSideFilterOptions,
                      }}
                    />
                  ))}
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
