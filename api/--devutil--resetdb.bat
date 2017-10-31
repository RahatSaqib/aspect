mysql -u root -pmysqlroot -e "drop database aspect; create database aspect;" && yarn run knex migrate:latest && yarn run knex seed:run && echo done and dusted
