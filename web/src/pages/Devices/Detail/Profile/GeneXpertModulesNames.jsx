import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import AspectTooltip from '../../../../components/shared/AspectTooltip'
import { formatDateTime } from '../../../../utils/utils/dateFormat'
import styles from '../styles.module.css'
import messages from './messages'

const GeneXpertModulesNames = ({ modules }) => {
  const { formatMessage } = useIntl()

  return (
    <>
      {modules.map((module, idx) => (
        <React.Fragment key={module.moduleName}>
          <AspectTooltip
            title={
              module.lastResultDate
                ? formatMessage(messages.lastResultDateTooltip, {
                    date: formatDateTime(module.lastResultDate),
                  })
                : formatMessage(messages.noResults)
            }
            showHelpIcon={false}
            showPointerCursor={false}
            toolTipContainerClass={styles.inlineTooltip}
            iconClass=""
          >
            <span style={{ color: module.lastResultDate ? undefined : '#888' }}>{module.moduleName}</span>
          </AspectTooltip>
          {idx < modules.length - 1 ? ', ' : ''}
        </React.Fragment>
      ))}
    </>
  )
}

GeneXpertModulesNames.propTypes = {
  modules: PropTypes.arrayOf(
    PropTypes.shape({
      moduleName: PropTypes.string,
      lastResultDate: PropTypes.string,
    })
  ).isRequired,
}

export default GeneXpertModulesNames
