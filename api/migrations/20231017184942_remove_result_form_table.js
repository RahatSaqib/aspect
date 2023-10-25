exports.up = async function (knex) {
  await knex.schema.dropTableIfExists('ResultForm')
}

exports.down = async function (knex) {
  await knex.schema.createTable('ResultForm', resultForm => {
    resultForm.integer('partnerId').unsigned().index().references('id').inTable('Partner')
    resultForm.integer('assayId').unsigned().index().references('id').inTable('Assay')
    resultForm.specificType('formSchema', 'JSON')
    resultForm.primary(['partnerId', 'assayId'])
  })
}
