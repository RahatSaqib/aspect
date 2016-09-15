let db = require('../db')

exports.up = function(knex){
  db.load(knex)
  return db.run(up)
}

exports.down = function(knex){
  db.load(knex)
  return db.run(down)
}

function* up(){
}

function* down(){
}

function createTable(knex, name, fn){
  // using if not exists to allow transition from dev database
  // this may be temporary.
  return knex.schema.createTableIfNotExists(name, fn)
}
