module.exports = require('knex')({
  client: 'mssql',
    connection: {
        user: 'Hillar',
        password: 'conx13',
        database: 'Ribakood',
        server: '10.0.30.2',
        pool: {
          max: 10,
          min: 0,
          idleTimeoutMillis: 30000
        },
    },
})