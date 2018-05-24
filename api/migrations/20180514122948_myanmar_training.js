module.exports = require('../src/db').migration(up, down)

// TODO: Remove the following two ESLint ignore-settings when implementing migrations
/* eslint no-unused-vars: 0 */
/* eslint no-empty-function: 0 */
async function up(knex) {}
async function down(knex) {}
