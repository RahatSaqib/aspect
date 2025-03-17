module.exports = require('../utils').seed(async knex => {
  const supportedCultures = ['de-DE', 'en-US', 'fr-FR', 'pt-PT', 'ru-RU', 'uk-UA', 'es-ES']
  await knex('Person').update({ culture: 'en-US' }).whereNotIn('culture', supportedCultures)
  await knex('Country').update({ culture: 'en-US' }).whereNotIn('culture', supportedCultures)
}, __filename)
