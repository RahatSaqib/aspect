import { defineMessages } from 'react-intl'
import { assay } from '../../messages'
import { commonDefinitions } from '../../messages/customMessages'
import jobFunctionMessages from '../../messages/jobFunctionMessages'

export default {
  ...commonDefinitions,
  ...assay,
  ...jobFunctionMessages,
  ...defineMessages({
    contactDetails: {
      id: 'pages.PersonDetails.contactDetails',
      defaultMessage: 'Contact Details',
    },
    accountDetails: {
      id: 'pages.PersonDetails.accountDetails',
      defaultMessage: 'Account Details',
    },
    sectionOverview: {
      id: 'pages.PersonDetails.sectionOverview',
      defaultMessage: 'Overview',
    },
    sectionPasswordChange: {
      id: 'pages.PersonDetails.sectionPasswordChange',
      defaultMessage: 'Password Change',
    },
    systemAccessControl: {
      id: 'pages.PersonDetails.systemAccessControl',
      defaultMessage: 'Login',
    },
    jobAssignment: {
      id: 'pages.UserPreferences.jobAssignment',
      defaultMessage: 'Job Assignment',
    },

    title: {
      id: 'pages.PersonDetail.title',
      defaultMessage: 'Person Detail',
    },
    none: {
      id: 'pages.PersonDetails.none',
      defaultMessage: 'None',
    },
    languageAndTimezone: {
      id: 'pages.PersonDetails.languageAndTimezone',
      defaultMessage: 'Language & Timezone',
    },
    detailsCreatedSuccessfully: {
      id: 'pages.PersonDetails.detailsCreatedSuccessfully',
      defaultMessage: 'Contact Created Successfully',
    },
    contactDetailsCreatedMessage: {
      id: 'pages.PersonDetails.contactDetailsCreatedMessage',
      defaultMessage: 'Contact details created successfully',
    },
    detailsUpdatedSuccessfully: {
      id: 'pages.PersonDetails.detailsUpdatedSuccessfully',
      defaultMessage: 'Details Changed Successfully',
    },
    contactDetailsUpdatedMessage: {
      id: 'pages.PersonDetails.contactDetailsUpdatedMessage',
      defaultMessage: 'Contact details changed successfully',
    },
    loginDetailsUpdatedMessage: {
      id: 'pages.PersonDetails.loginDetailsUpdatedMessage',
      defaultMessage: 'You can now login with these new details',
    },
    userPreferencesUpdatedMessage: {
      id: 'pages.PersonDetails.userPreferencesUpdatedMessage',
      defaultMessage: 'User preferences changed successfully',
    },
    fullName: {
      id: 'pages.ContactDetails.name',
      defaultMessage: 'Full Name',
    },
    jobTitle: {
      id: 'pages.ContactDetails.title',
      defaultMessage: 'Title',
    },
    emailHeader: {
      id: 'pages.ContactDetails.emailHeader',
      defaultMessage: 'Email',
    },
    primaryEmail: {
      id: 'pages.ContactDetails.email',
      defaultMessage: 'Email',
    },
    secondaryEmail: {
      id: 'pages.ContactDetails.email2',
      defaultMessage: 'Alternate Email',
    },
    phone: {
      id: 'pages.ContactDetails.phoneHeader',
      defaultMessage: 'Phone',
    },
    telephone: {
      id: 'pages.ContactDetails.phone',
      defaultMessage: 'Telephone',
    },
    mobile: {
      id: 'pages.AccountDetails.cell',
      defaultMessage: 'Mobile',
    },
    partner: {
      id: 'pages.AccountDetails.partner',
      defaultMessage: 'Partner',
    },
    location: {
      id: 'pages.ContactDetails.locationHeader',
      defaultMessage: 'Location',
    },
    all: {
      id: 'pages.PersonDetails.all',
      defaultMessage: 'All',
    },
    country: {
      id: 'pages.PersonDetails.country',
      defaultMessage: 'Country',
    },
    zip: {
      id: 'pages.ContactDetails.zip',
      defaultMessage: 'Zip Code',
    },
    notes: {
      id: 'pages.ContactDetails.notes',
      defaultMessage: 'Notes',
    },
    save: {
      id: 'pages.PersonDetails.save',
      defaultMessage: 'Save',
    },
    nameRequired: {
      id: 'pages.ContactDetails.nameRequired',
      defaultMessage: 'Please enter your Full name',
    },
    emailRequired: {
      id: 'pages.ContactDetails.emailRequired',
      defaultMessage: 'Please enter your email',
    },
    countryRequired: {
      id: 'pages.ContactDetails.countryRequired',
      defaultMessage: 'Please select Country',
    },
    invalidEmailAddress: {
      id: 'pages.ContactDetails.invalidEmailAddress',
      defaultMessage: 'Please enter a valid email address',
    },
    username: {
      id: 'pages.UpdateLoginDetails.username',
      defaultMessage: 'Username',
    },
    newPassword: {
      id: 'pages.UpdateLoginDetails.newPassword',
      defaultMessage: 'New Password',
    },
    newPasswordRequired: {
      id: 'pages.ResetPassword.newPasswordRequired',
      defaultMessage: 'Please enter a new password',
    },
    confirmNewPassword: {
      id: 'pages.UpdateLoginDetails.confirmNewPassword',
      defaultMessage: 'Confirm New Password',
    },
    confirmNewPasswordRequired: {
      id: 'pages.UpdateLoginDetails.confirmNewPasswordRequired',
      defaultMessage: 'Please confirm new password',
    },
    confirmNewPasswordMatch: {
      id: 'pages.UpdateLoginDetails.confirmNewPasswordMatch',
      defaultMessage: 'Password must match',
    },
    passwordConditionsShouldFulfilled: {
      id: 'pages.UpdateLoginDetails.passwordConditionsShouldFulfilled',
      defaultMessage: 'Conditions Should be Fulfilled',
    },
    currentPassword: {
      id: 'pages.UpdateLoginDetails.currentPassword',
      defaultMessage: 'Current Password',
    },
    usernameRequired: {
      id: 'pages.UpdateLoginDetails.usernameRequired',
      defaultMessage: 'A username is required',
    },
    currentPasswordRequired: {
      id: 'pages.UpdateLoginDetails.currentPasswordRequired',
      defaultMessage: 'Please enter your current password to update your login details',
    },
    newPasswordTooShort: {
      id: 'pages.UpdateLoginDetails.newPasswordTooShort',
      defaultMessage: 'The password needs to be at least 8 characters long',
    },
    newPasswordMustContainANumberOrSpecialCharacter: {
      id: 'pages.UpdateLoginDetails.newPasswordMustContainANumberOrSpecialCharacter',
      defaultMessage: 'The password needs to contain at least one number or special character (%!$*...)',
    },
    userLockedOutLabel: {
      id: 'pages.UpdateLoginDetails.userEnableLabel',
      defaultMessage: 'User lockedout',
    },
    passwordsDoNotMatch: {
      id: 'pages.UpdateLoginDetails.passwordsDoNotMatch',
      defaultMessage: "These passwords don't match",
    },
    currentPasswordDialogHeader: {
      id: 'pages.UpdateLoginDetails.currentPasswordDialogHeader',
      defaultMessage: 'Enter Current Password',
    },
    currentPasswordDialogMessage: {
      id: 'pages.UpdateLoginDetails.currentPasswordDialogMessage',
      defaultMessage: 'To update your login details, please enter your current password',
    },
    submitCurrentPassword: {
      id: 'pages.UpdateLoginDetails.submitCurrentPassword',
      defaultMessage: 'Submit',
    },
    cancelCurrentPassword: {
      id: 'pages.UpdateLoginDetails.cancelCurrentPassword',
      defaultMessage: 'Cancel',
    },
    usernameUnavailable: {
      id: 'pages.UpdateLoginDetails.usernameUnavailable',
      defaultMessage: 'This username is unavailable',
    },
    invalidPassword: {
      id: 'pages.UpdateLoginDetails.invalidPassword',
      defaultMessage: 'The password that you entered is not valid',
    },
    timezone: {
      id: 'pages.UserPreferences.timezone',
      defaultMessage: 'Time Zone',
    },
    language: {
      id: 'pages.UserPreferences.language',
      defaultMessage: 'Language',
    },
    tags: {
      id: 'pages.UserPreferences.tags',
      defaultMessage: 'Tags',
    },
    chooseTags: {
      id: 'pages.UserPreferences.chooseTags',
      defaultMessage: 'Choose tags',
    },
    notificationTags: {
      id: 'pages.UserPreferences.notificationTags',
      defaultMessage: 'Notification Tags',
    },
    fieldNoMatchTags: {
      id: 'pages.UserPreferences.fieldNoMatchTags',
      defaultMessage: 'Press enter to add tag',
    },

    job: {
      id: 'pages.UserPreferences.job',
      defaultMessage: 'Job',
    },
    assignmentDetails: {
      id: 'pages.UserPreferences.assignmentDetails',
      defaultMessage: 'Assignment Details',
    },
    assignments: {
      id: 'pages.UserPreferences.assignments',
      defaultMessage: 'This contact is assigned to:',
    },
    create: {
      id: 'pages.PersonDetails.create',
      defaultMessage: 'Create',
    },
    site: {
      id: 'pages.JobAssignments.site',
      defaultMessage: 'Site',
    },
    selectJob: {
      id: 'pages.JobAssignments.selectJob',
      defaultMessage: 'Select Job',
    },
    jobRequired: {
      id: 'pages.JobAssignments.jobRequired',
      defaultMessage: 'Please select Job',
    },
    cancel: {
      id: 'pages.JobAssignments.cancel',
      defaultMessage: 'Cancel',
    },
    yesDelete: {
      id: 'pages.JobAssignments.yesDelete',
      defaultMessage: 'Yes, delete',
    },
    allStates: {
      id: 'pages.JobAssignments.allStates',
      defaultMessage: 'All states',
    },
    allAreas: {
      id: 'pages.JobAssignments.allAreas',
      defaultMessage: 'All areas',
    },
    allSites: {
      id: 'pages.JobAssignments.allSites',
      defaultMessage: 'All sites',
    },
    disease: {
      id: 'pages.JobAssignments.disease',
      defaultMessage: 'Disease',
    },
    allDiseases: {
      id: 'pages.JobAssignments.allDiseases',
      defaultMessage: 'All diseases',
    },
    diseaseNameDengueFever: {
      id: 'filter.DiseaseSelectField.diseaseNameDengueFever',
      defaultMessage: 'Dengue Fever',
    },
    diseaseNameEbola: {
      id: 'filter.DiseaseSelectField.diseaseNameEbola',
      defaultMessage: 'Ebola',
    },
    diseaseNameHepatitisB: {
      id: 'filter.DiseaseSelectField.diseaseNameHepatitisB',
      defaultMessage: 'Hepatitis B',
    },
    diseaseNameHepatitisC: {
      id: 'filter.DiseaseSelectField.diseaseNameHepatitisC',
      defaultMessage: 'Hepatitis C',
    },
    diseaseNameHIVAIDS: {
      id: 'filter.DiseaseSelectField.diseaseNameHIVAIDS',
      defaultMessage: 'HIV/AIDS',
    },
    diseaseNameCovid19: {
      id: 'filter.DiseaseSelectField.diseaseNameCovid19',
      defaultMessage: 'SARS-CoV-2 (COVID-19)',
    },
    diseaseNameTuberculosis: {
      id: 'filter.DiseaseSelectField.diseaseNameTuberculosis',
      defaultMessage: 'Tuberculosis',
    },
    diseaseNameZikaFever: {
      id: 'filter.DiseaseSelectField.diseaseNameZikaFever',
      defaultMessage: 'Zika Fever',
    },
    deviceType: {
      id: 'pages.JobAssignments.deviceType',
      defaultMessage: 'Device Type',
    },
    allDeviceTypes: {
      id: 'pages.JobAssignments.allDeviceTypes',
      defaultMessage: 'All device types',
    },
    assayType: {
      id: 'pages.JobAssignments.assayType',
      defaultMessage: 'Assay Type',
    },
    allAssayTypes: {
      id: 'pages.JobAssignments.allAssayTypes',
      defaultMessage: 'All assay types',
    },
    assay: {
      id: 'pages.JobAssignments.assay',
      defaultMessage: 'Assay',
    },
    tag: {
      id: 'pages.JobAssignments.tag',
      defaultMessage: 'Tag',
    },
    restrictToSitesWithTag: {
      id: 'pages.JobAssignments.restrictToSitesWithTag',
      defaultMessage: 'Restrict to Sites with Tag',
    },
    allAssays: {
      id: 'pages.JobAssignments.allAssays',
      defaultMessage: 'All assays',
    },
    userCanAlsoLogIn: {
      id: 'page.contacts.person.userCanAlsoLogIn',
      defaultMessage: 'This contact can log in as a user',
    },
    userLockedOut: {
      id: 'page.contacts.person.userLockedOut',
      defaultMessage: 'User is locked?',
    },
    locked: {
      id: 'page.contacts.person.locked',
      defaultMessage: 'Locked',
    },
    unlocked: {
      id: 'page.contacts.person.unlocked',
      defaultMessage: 'Unlocked',
    },
    notSpecified: {
      id: 'page.contacts.person.notSpecified',
      defaultMessage: 'Not specified',
    },
    removeAssignment: {
      id: 'page.contacts.person.removeAssignment',
      defaultMessage: 'Do you want to remove below assignment?',
    },
    backToTable: {
      id: 'page.contacts.person.backToTable',
      defaultMessage: 'Back to table',
    },
    back: {
      id: 'page.contacts.person.back',
      defaultMessage: 'Back',
    },
    saveAndNext: {
      id: 'page.contacts.person.saveAndNext',
      defaultMessage: ' Save & Next',
    },
    saveAndTable: {
      id: 'page.contacts.person.saveAndTable',
      defaultMessage: ' Save & Back to table',
    },
    next: {
      id: 'page.contacts.person.next',
      defaultMessage: 'Next',
    },
    addAssignment: {
      id: 'page.contacts.person.addAssignment',
      defaultMessage: 'Add Assignment',
    },
    pendingChanges: {
      id: 'page.contacts.person.pendingChanges',
      defaultMessage: 'Pending changes',
    },
  }),
}
