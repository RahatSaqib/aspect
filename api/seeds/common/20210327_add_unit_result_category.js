module.exports = async knex => {
  await knex('ResultCategory').update('name', '< 40 cp/mL').where('externalId', 'LessThan40')
  await knex('ResultCategory').update('name', '>= 40 cp/mL').where('externalId', 'MoreThan40')
  await knex('ResultCategory').update('name', '< 150 cp/mL').where('externalId', 'LessThan150')
  await knex('ResultCategory').update('name', '>= 150 cp/mL').where('externalId', 'MoreThan150')
  await knex('ResultCategory').update('name', '< 550 cp/mL').where('externalId', 'LessThan550')
  await knex('ResultCategory').update('name', '>= 550 cp/mL').where('externalId', 'MoreThan550')
  await knex('ResultCategory').update('name', '< 1000 cp/mL').where('externalId', 'LessThan1000')
  await knex('ResultCategory').update('name', '>= 1000 cp/mL').where('externalId', 'MoreThan1000')
}
