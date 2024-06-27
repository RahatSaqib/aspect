import { defineMessages } from 'react-intl'

export const stateMutationErrors = {
  409: {
    'There are states with the same name or abbreviation': {
      severity: 'warn',
      ...defineMessages({
        title: {
          id: 'errorResponseMessages.stateMutation.title',
          defaultMessage: 'Validation error',
        },
        message: {
          id: 'errorResponseMessages.stateMutation.message',
          defaultMessage: 'There are existing ones with the same name or abbreviation',
        },
      }),
    },
  },
}

export const stateDeleteErrors = {
  409: {
    'Unable to delete State, as there are associated entities with it': {
      severity: 'warn',
      ...defineMessages({
        title: {
          id: 'errorResponseMessages.stateDelete.title',
          defaultMessage: 'Validation error',
        },
        message: {
          id: 'errorResponseMessages.stateDelete.message',
          defaultMessage: 'Unable to delete since there are associated entities with it',
        },
      }),
    },
  },
}

export const lgaMutationErrors = {
  409: {
    'There are lgas with the same name': {
      severity: 'warn',
      ...defineMessages({
        title: {
          id: 'errorResponseMessages.lgaMutation.title',
          defaultMessage: 'Validation error',
        },
        message: {
          id: 'errorResponseMessages.lgaMutation.message',
          defaultMessage: 'There are existing ones with the same name',
        },
      }),
    },
  },
}

export const lgaDeleteErrors = {
  409: {
    'Unable to delete LGA, as there are associated entities with it.': {
      severity: 'warn',
      ...defineMessages({
        title: {
          id: 'errorResponseMessages.lgaDelete.title',
          defaultMessage: 'Validation error',
        },
        message: {
          id: 'errorResponseMessages.lgaDelete.message',
          defaultMessage: 'Unable to delete since there are associated entities with it.',
        },
      }),
    },
  },
}
