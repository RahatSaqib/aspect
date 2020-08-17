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

const cssClasses = classnames.bind(require('../GraphsContainer.css'))

const GraphContainer = ({ config, size, assaysFromState, whiteListed }) => {
  const { title, id, selectorModifiers = false } = config
  const { formatMessage: intlFormatMessage } = useIntl()
  const { graphType } = config
  const { innerSize, outerSize } = size
  const [graphParams, setGraphParams] = useState(false)

  const updateFromActionComponent = params => {
    const { identifier, selectedOption } = params
    setGraphParams(extractOptionValue(identifier, selectedOption))
  }

  return (
    <PermissionsProvider
      permissions={whiteListed ? ['site:view'] : ['result:view']}
    >
      <Grid item xs={12} lg={outerSize}>
        <Grid container>
          <Grid item xs={12}>
            <AspectCard
              title={intlFormatMessage(messages[title])}
              innerSize={innerSize}
              justify="center"
              action={params => updateFromActionComponent({ ...params })}
              actionComponent={{
                component: CardSelectors,
                props: selectorModifiers,
              }}
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
                      updatedParams={graphParams}
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
