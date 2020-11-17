const { admin, regionalOfficer, labUser, clinician } = require('../../common/fixtures/jobFunctions')

module.exports = [
    { 
        name: admin.name,
        permissions: [...admin.permissions, { module: 'patient', activity: 'view'}, { module: 'patient', activity: 'edit'} ]
    },
    regionalOfficer,
    labUser,
    clinician,
    {
        name: 'Manager',
        permissions: [
            {
                module: 'treatmentStatus',
                activity: 'edit',
            },
            {
                module: 'site',
                activity: 'edit',
            },
            {
                module: 'device',
                activity: 'edit',
            },
            {
                module: 'assay',
                activity: 'edit',
            },
            {
                module: 'inventory',
                activity: 'edit',
            },
            {
                module: 'reporter',
                activity: 'edit',
            }
        ],
    }
]