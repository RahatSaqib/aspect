import React from 'react'
import PermIdentity from '@material-ui/icons/PermIdentity'
import { format as date, differenceInCalendarDays } from 'date-fns'
import { compose, pure } from 'recompose'
import requirePermission from '../../components/shared/requirePermissions'
import AspectCheckBox from '../../components/shared/AspectCheckbox'

import {
  ExpansionPanel,
  ExpansionPanelHeader,
  ExpansionPanelDetail,
} from '../../components/shared/expansionPanel'

const enhance = compose(
  pure,
  requirePermission({
    permissions: ['treatmentStatus:view'],
  })
)
const ResultTreatmentPanel = ({ styles, data, restProps }) => (
  <ExpansionPanel className={styles.TreatmentNoteExpansionPanelContainer}>
    <ExpansionPanelHeader
      label={
        <div className={styles.Treatment}>
          <PermIdentity className={styles[`${data.get('treatmentStatus')}`]} />
          <div className={styles.TreatmentInfo}>
            <h6>Not yet confirmed</h6>
            <h6>now now</h6>
            <h3>
              {differenceInCalendarDays(new Date(), data.get('endedOn'))} days
            </h3>
          </div>
        </div>
      }
    >
      <div className={styles.TreatmentLinkLayout}>
        <div className={styles.TreatmentTitle}>
          <p>Linked to treatment </p>
          <p>Add Note </p>
        </div>
        <div className={styles.TreatmentCheckBox}>
          {[
            {
              id: 'OnTreatment',
              label: 'Confirmed',
            },
            {
              id: 'NotPossible',
              label: 'Not possible',
            },
          ].map(treatmentCheckbox => (
            <div>
              <AspectCheckBox
                onChange={restProps.onTreatmentChange}
                id={treatmentCheckbox.id}
                disabled={
                  !restProps.userPermission.includes('treatmentStatus:edit')
                }
                checked={
                  treatmentCheckbox.id === data.get('resultTreatmentStatus')
                }
              />{' '}
              {treatmentCheckbox.label}
              {treatmentCheckbox.treatmentStatus && (
                <span>
                  -{' '}
                  {date(
                    data.get('resultTreatmentStatusChangedOn'),
                    'dd/MM/yyyy'
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </ExpansionPanelHeader>
    <ExpansionPanelDetail className={styles.TreatmentNoteContainer}>
      <div className={styles.TreatmentNoteHeader}>
        <p>NOTE:</p>
      </div>
      <div className={styles.TreatmentNoteBody}>
        Patient came in yesterday and i recorded the results in our register
      </div>
      <div className={styles.TreatmentNoteFooter}>
        <p>Note added by:</p>
        <p>dparrishhill - 16/04/2019</p>
      </div>
    </ExpansionPanelDetail>
  </ExpansionPanel>
)

export default enhance(ResultTreatmentPanel)
