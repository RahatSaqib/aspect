import React from 'react'
import PermIdentity from '@material-ui/icons/PermIdentity'
import { format as date, differenceInCalendarDays } from 'date-fns'
import { compose, pure } from 'recompose'
import requirePermission from '../../components/shared/requirePermissions'

import {
  ExpansionPanel,
  ExpansionPanelHeader,
  ExpansionPanelDetail,
} from '../../components/shared/expansionPanel'
import CheckboxField from '../../components/shared/CheckboxField'

const enhance = compose(
  pure,
  requirePermission({
    permissions: [
      'treatmentStatus:admin',
      'treatmentStatus:view',
      'treatmentStatus:edit',
    ],
  })
)
const ResultTreatmentPanel = ({ styles, data, ...restProps }) => {
  const treatmentCheckBoxList = [
    {
      id: 'OnTreatment',
      label: 'Confirmed',
    },
    {
      id: 'NotPossible',
      label: 'Not possible',
    },
    {
      id: 'AwaitingTreatment',
      label: 'Not yet confirmed on treatment',
    },
  ]

  return (
    <ExpansionPanel className={styles.TreatmentNoteExpansionPanelContainer}>
      <ExpansionPanelHeader
        label={
          <div className={styles.Treatment}>
            <PermIdentity
              className={styles[`${data.get('treatmentStatusInfo')}`]}
            />

            <div className={styles.TreatmentInfo}>
              {treatmentCheckBoxList.map(
                treatmentStatus =>
                  treatmentStatus.id === data.get('resultTreatmentStatus') && (
                    <h4>
                      {treatmentStatus.label}{' '}
                      {treatmentStatus.id !== 'AwaitingTreatment' && (
                        <span>
                          -{' '}
                          {date(
                            data.get('resultTreatmentStatusChangedOn'),
                            'dd/MM/yyyy'
                          )}
                        </span>
                      )}
                    </h4>
                  )
              )}
              <h3>
                {differenceInCalendarDays(new Date(), data.get('endedOn'))} days
              </h3>
            </div>
          </div>
        }
      >
        <div className={styles.TreatmentLinkLayout}>
          <div className={styles.TreatmentTitle}>
            <p>Link to Treatment</p>
          </div>
          <div className={styles.TreatmentCheckBox}>
            {treatmentCheckBoxList.map(
              treatmentCheckbox =>
                treatmentCheckbox.id !== 'AwaitingTreatment' && (
                  <CheckboxField
                    onChange={restProps.onTreatmentChange}
                    id={treatmentCheckbox.id}
                    disabled={
                      !restProps.userPermission.includes(
                        'treatmentStatus:admin'
                      ) &&
                      !restProps.userPermission.includes('treatmentStatus:edit')
                    }
                    checked={
                      treatmentCheckbox.id === data.get('resultTreatmentStatus')
                    }
                    label={treatmentCheckbox.label}
                  />
                )
            )}
            <div>Add Note </div>
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
}

export default enhance(ResultTreatmentPanel)
