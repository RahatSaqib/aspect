import React from 'react'
import { string } from 'yup'
import isEmpty from 'lodash/isEmpty'
import {
  PureTextInput,
  PureCheckboxInput,
  PureChip,
  PurePhoneNumber,
} from '../../Form/PureFormik/Inputs'
import CountrySelect from './CountrySelect'
import StateSelect from './StateSelect'
import LGASelect from './LGASelect'
import PartnerSelect from './PartnerSelect'
import TimezoneSelect from './TimezoneSelect'
import LanguageSelect from './LanguageSelect'
import { i18nWrapper } from '../../../Providers/I18nProvider'
import messages from '../../../person/detail/messages.js'
import { getCustomMessage } from '../../../shared/utils/customMessages'

const PaddedCheckBox = props => {
  return (
    <div style={{ padding: '20px 0 0 12px' }}>
      <PureCheckboxInput {...props} />
    </div>
  )
}

const itemsConfig = user => {
  const { formatMessage } = i18nWrapper()
  return {
    row0: [
      {
        id: 'canLogIn',
        label: formatMessage(messages.userCanAlsoLogIn),
        type: 'checkbox',
        component: PaddedCheckBox,
        validation: string().required('Required'),
      },
    ],
    row1: [
      {
        id: 'name',
        label: formatMessage(messages.fullName),
        type: 'text',
        component: PureTextInput,
        validation: string().required('Required'),
      },
      {
        id: 'title',
        label: formatMessage(messages.jobTitle),
        type: 'text',
        component: PureTextInput,
        validation: string().nullable(),
      },
    ],
    row2: [
      {
        id: 'email',
        label: formatMessage(messages.primaryEmail),
        type: 'email',
        component: PureTextInput,
        validation: string().email('Invalid email').required('Required'),
      },
      {
        id: 'email2',
        label: formatMessage(messages.secondaryEmail),
        type: 'email',
        component: PureTextInput,
        validation: string().when('email', {
          is: val => !isEmpty(val),
          then: string().email('Invalid email').nullable(),
          otherwise: string().nullable(),
        }),
      },
    ],
    row3: [
      {
        id: 'phone',
        label: formatMessage(messages.telephone),
        type: 'telephone',
        component: PurePhoneNumber,
        validation: string().nullable(),
      },
      {
        id: 'cell',
        label: formatMessage(messages.mobile),
        type: 'telephone',
        component: PurePhoneNumber,
        validation: string().nullable(),
      },
    ],
    row4: [
      {
        id: 'countryId',
        label: formatMessage(messages.country),
        type: 'select',
        component: CountrySelect,
        validation: string().nullable(),
      },
      {
        id: 'stateId',
        label: getCustomMessage(messages, 'state', user),
        type: 'select',
        component: StateSelect,
        validation: string().nullable(),
      },
      {
        id: 'lgaId',
        label: getCustomMessage(messages, 'lga', user),
        type: 'select',
        component: LGASelect,
        validation: string().nullable(),
      },
      {
        id: 'zip',
        label: formatMessage(messages.zip),
        type: 'text',
        component: PureTextInput,
        validation: string().nullable(),
      },
    ],
    row5: [
      {
        id: 'lastPartnerId',
        label: formatMessage(messages.partner),
        type: 'select',
        component: PartnerSelect,
        validation: string().required('Required'),
      },
    ],
    row6: [
      {
        id: 'timezone',
        label: formatMessage(messages.timezone),
        type: 'select',
        component: TimezoneSelect,
        validation: string().nullable(),
      },
      {
        id: 'culture',
        label: formatMessage(messages.language),
        type: 'select',
        component: LanguageSelect,
        validation: string().nullable(),
      },
    ],
    row7: [
      {
        id: 'tags',
        label: formatMessage(messages.chooseTags),
        type: 'hidden',
        component: PureChip,
        validation: string().nullable(),
      },
    ],
    row8: [
      {
        id: 'notes',
        label: formatMessage(messages.notes),
        type: 'textarea',
        component: PureTextInput,
        validation: string().nullable(),
      },
    ],
  }
}

export default itemsConfig
