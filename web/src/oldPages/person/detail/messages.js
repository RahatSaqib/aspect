import { defineMessages } from 'react-intl'
import { commonDefinitions } from '../../../messages/customMessages'
import jobFunctionMessages from '../../../messages/jobFunctionMessages'

// Define all messages for /site/detail page
export default {
  ...commonDefinitions,
  ...jobFunctionMessages,
  ...defineMessages({
    title: {
      id: 'pages.PersonDetail.title',
      defaultMessage: 'Person Detail',
    },
    contactDetails: {
      id: 'pages.PersonDetails.contactDetails',
      defaultMessage: 'Contact Details',
    },
    systemAccessControl: {
      id: 'pages.PersonDetails.systemAccessControl',
      defaultMessage: 'Login',
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
    fieldNoMatchTags: {
      id: 'pages.UserPreferences.fieldNoMatchTags',
      defaultMessage: 'Press enter to add tag',
    },
    jobAssignment: {
      id: 'pages.UserPreferences.jobAssignment',
      defaultMessage: 'Job Assignment',
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
    assayTypeCD4: {
      id: 'filter.AssayTypeSelectField.assayTypeCD4',
      defaultMessage: 'CD4 Count',
    },
    covid19: {
      id: 'filter.AssayTypeSelectField.covid19',
      defaultMessage: 'COVID-19 Test',
    },
    assayTypeDengue: {
      id: 'filter.AssayTypeSelectField.assayTypeDengue',
      defaultMessage: 'Dengue',
    },
    assayTypeEbola: {
      id: 'filter.AssayTypeSelectField.assayTypeEbola',
      defaultMessage: 'Ebola',
    },
    assayTypeEid: {
      id: 'filter.AssayTypeSelectField.assayTypeEid',
      defaultMessage: 'EID',
    },
    genericRDT: {
      id: 'filter.AssayTypeSelectField.genericRDT',
      defaultMessage: 'Generic RDT',
    },
    genoTypeTestStrip: {
      id: 'filter.AssayTypeSelectField.genoTypeTestStrip',
      defaultMessage: 'GenoType Test Strip',
    },
    assayTypeHbvVl: {
      id: 'filter.AssayTypeSelectField.assayTypeHbvVl',
      defaultMessage: 'HBV VL',
    },
    assayTypeHcv: {
      id: 'filter.AssayTypeSelectField.assayTypeHcv',
      defaultMessage: 'HCV',
    },
    assayTypeHivQual: {
      id: 'filter.AssayTypeSelectField.assayTypeHivQual',
      defaultMessage: 'HIV Qual',
    },
    assayTypeHivVl: {
      id: 'filter.AssayTypeSelectField.assayTypeHivVl',
      defaultMessage: 'HIV VL',
    },
    assayTypeLipidPanel: {
      id: 'filter.AssayTypeSelectField.assayTypeLipidPanel',
      defaultMessage: 'Lipid Panel',
    },
    assayTypeMtbRif: {
      id: 'filter.AssayTypeSelectField.assayTypeMtbRif',
      defaultMessage: 'MTB/Rif',
    },
    assayTypeTbAst: {
      id: 'filter.AssayTypeSelectField.assayTypeTbAst',
      defaultMessage: 'TB AST',
    },
    assayTypeTbGnd: {
      id: 'filter.AssayTypeSelectField.assayTypeTbGnd',
      defaultMessage: 'TB G&D',
    },
    assayTypeUnknown: {
      id: 'filter.AssayTypeSelectField.assayTypeUnknown',
      defaultMessage: 'Unknown',
    },
    assayTypeZika: {
      id: 'filter.AssayTypeSelectField.assayTypeZika',
      defaultMessage: 'Zika',
    },
    assay: {
      id: 'pages.JobAssignments.assay',
      defaultMessage: 'Assay',
    },
    allAssays: {
      id: 'pages.JobAssignments.allAssays',
      defaultMessage: 'All assays',
    },
    AssayAbbottM2000DBSHivVl: {
      id: 'filter.AssaySelectField.AssayAbbottM2000DBSHivVl',
      defaultMessage: 'Abbott m2000 DBS HIV VL',
    },
    AssayAbbottM2000HivEid: {
      id: 'filter.AssaySelectField.AssayAbbottM2000HivEid',
      defaultMessage: 'Abbott m2000 HIV EID',
    },
    abbottM2000PlasmaHbvVL: {
      id: 'filter.AssaySelectField.abbottM2000PlasmaHbvVL',
      defaultMessage: 'Abbott m2000 Plasma HBV VL',
    },
    abbottM2000PlasmaHivVL: {
      id: 'filter.AssaySelectField.abbottM2000PlasmaHivVL',
      defaultMessage: 'Abbott m2000 Plasma HIV VL',
    },
    assayAlereQHiv12Detect: {
      id: 'filter.AssaySelectField.assayAlereQHiv12Detect',
      defaultMessage: 'Alere Q HIV-1/2 Detect',
    },
    assayAlereQHiv12VLPlasma: {
      id: 'filter.AssaySelectField.assayAlereQHiv12VLPlasma',
      defaultMessage: 'Alere Q HIV-1/2 VL plasma',
    },
    assayBdMgitAst: {
      id: 'filter.AssaySelectField.assayBdMgitAst',
      defaultMessage: 'BD MGIT AST',
    },
    assayBdMgitGnd: {
      id: 'filter.AssaySelectField.assayBdMgitGnd',
      defaultMessage: 'BD MGIT GND',
    },
    AssayChaiEid: {
      id: 'filter.AssaySelectField.AssayChaiEid',
      defaultMessage: 'CHAI EID',
    },
    AssayChaiHivVl: {
      id: 'filter.AssaySelectField.AssayChaiHivVl',
      defaultMessage: 'CHAI HIV VL',
    },
    assayCobasHivVl: {
      id: 'filter.AssaySelectField.assayCobasHivVl',
      defaultMessage: 'COBAS 4800 VL',
    },
    assayCommCareGatesRDT: {
      id: 'filter.AssaySelectField.assayCommCareGatesRDT',
      defaultMessage: 'CommCare Gates RDT',
    },
    commCareHiv: {
      id: 'filter.AssaySelectField.commCareHiv',
      defaultMessage: 'CommCare HIV',
    },
    assayGenericCovid19: {
      id: 'filter.AssaySelectField.assayGenericCovid19',
      defaultMessage: 'COVID-19 Generic Test',
    },
    assayCulture: {
      id: 'filter.AssaySelectField.assayCulture',
      defaultMessage: 'Culture',
    },
    assayDaktariCD4: {
      id: 'filter.AssaySelectField.assayDaktariCD4',
      defaultMessage: 'Daktari CD4',
    },
    assayDaktariHcv: {
      id: 'filter.AssaySelectField.assayDaktariHcv',
      defaultMessage: 'Daktari HCV',
    },
    assayDaktariHivVl: {
      id: 'filter.AssaySelectField.assayDaktariHivVl',
      defaultMessage: 'Daktari HIV-VL',
    },
    genericRdt: {
      id: 'filter.AssaySelectField.genericRdt',
      defaultMessage: 'Generic RDT',
    },
    assayGXCovid19: {
      id: 'filter.AssaySelectField.assayGXCovid19',
      defaultMessage: 'GeneXpert COVID-19',
    },
    assayGeneXpertEbola: {
      id: 'filter.AssaySelectField.assayGeneXpertEbola',
      defaultMessage: 'GeneXpert Ebola',
    },
    assayGeneXpertHcv: {
      id: 'filter.AssaySelectField.assayGeneXpertHcv',
      defaultMessage: 'GeneXpert HCV',
    },
    assayGeneXpertHiv1Qual: {
      id: 'filter.AssaySelectField.assayGeneXpertHiv1Qual',
      defaultMessage: 'GeneXpert HIV-1 Qual',
    },
    assayGeneXpertHiv1Vl: {
      id: 'filter.AssaySelectField.assayGeneXpertHiv1Vl',
      defaultMessage: 'GeneXpert HIV-1 VL',
    },
    assayGeneXpertMtbRif: {
      id: 'filter.AssaySelectField.assayGeneXpertMtbRif',
      defaultMessage: 'GeneXpert MTB/Rif',
    },
    assayGeneXpertMtbXdr: {
      id: 'filter.AssaySelectField.assayGeneXpertMtbXdr',
      defaultMessage: 'GeneXpert MTB/XDR',
    },
    assayGeneXpertMtbRifUltra: {
      id: 'filter.AssaySelectField.assayGeneXpertMtbRifUltra',
      defaultMessage: 'GeneXpert MTB/Rif Ultra',
    },
    assayGeneXpertUnknown: {
      id: 'filter.AssaySelectField.assayGeneXpertUnknown',
      defaultMessage: 'GeneXpert Unknown',
    },
    assayTruenatMtb: {
      id: 'filter.AssaySelectField.assayTruenatMtb',
      defaultMessage: 'Truenat® MTB',
    },
    assayTruenatMtbPlus: {
      id: 'filter.AssaySelectField.assayTruenatMtbPlus',
      defaultMessage: 'Truenat® MTB Plus',
    },
    assayTruenatRif: {
      id: 'filter.AssaySelectField.assayTruenatRif',
      defaultMessage: 'Truenat® MTB-RIF Dx',
    },
    assayTruenatUnknown: {
      id: 'filter.AssaySelectField.assayTruenatUnknown',
      defaultMessage: 'Truenat® Unknown Test Type',
    },
    assayGenoTypeMTBCV1: {
      id: 'filter.AssaySelectField.assayGenoTypeMTBCV1',
      defaultMessage: 'GenoType MTBC VER 1.X',
    },
    assayGenoTypeMTBDRplusV2: {
      id: 'filter.AssaySelectField.assayGenoTypeMTBDRplusV2',
      defaultMessage: 'GenoType MTBDRplus VER 2.0',
    },
    assayGenoTypeMTBDRslV1: {
      id: 'filter.AssaySelectField.assayGenoTypeMTBDRslV1',
      defaultMessage: 'GenoType MTBDRsl VER 1.0',
    },
    assayGenoTypeMTBDRslV2: {
      id: 'filter.AssaySelectField.assayGenoTypeMTBDRslV2',
      defaultMessage: 'GenoType MTBDRsl VER 2.0',
    },
    assayMP96Covid19: {
      id: 'filter.AssaySelectField.assayMP96Covid19',
      defaultMessage: 'MagNA Pure-96 COVID-19',
    },
    assayQHivVl: {
      id: 'filter.AssaySelectField.assayQHivVl',
      defaultMessage: 'Q HIV VL',
    },
    assayQS7Covid19: {
      id: 'filter.AssaySelectField.assayQS7Covid19',
      defaultMessage: 'QuantStudio7 Flex COVID-19',
    },
    AssayReporterEid: {
      id: 'filter.AssaySelectField.AssayReporterEid',
      defaultMessage: 'Reporter EID',
    },
    AssayReporterHivVl: {
      id: 'filter.AssaySelectField.AssayReporterHivVl',
      defaultMessage: 'Reporter HIV VL',
    },
    assaySenaiteLIMSSmearMicroscopy: {
      id: 'filter.AssaySelectField.assaySenaiteLIMSSmearMicroscopy',
      defaultMessage: 'Senaite LIMS Smear Microscopy',
    },
    assaySenaiteLIMSTbCulture: {
      id: 'filter.AssaySelectField.assaySenaiteLIMSTbCulture',
      defaultMessage: 'Senaite LIMS TB Culture',
    },
    assaySenaiteLIMSUnknown: {
      id: 'filter.AssaySelectField.assaySenaiteLIMSUnknown',
      defaultMessage: 'Senaite LIMS Unknown',
    },
    assayGenericDst: {
      id: 'filter.AssaySelectField.assayGenericDst',
      defaultMessage: 'TB DST',
    },
    userCanAlsoLogIn: {
      id: 'page.contacts.person.userCanAlsoLogIn',
      defaultMessage: 'This contact can log in as a user',
    },
    notSpecified: {
      id: 'page.contacts.person.notSpecified',
      defaultMessage: 'Not specified',
    },
    removeAssignment: {
      id: 'page.contacts.person.removeAssignment',

      default: 'Do you want to remove below assignment?',
    },
  }),
}
