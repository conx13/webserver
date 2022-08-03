module.exports = require('knex')({
  client: 'mssql',
<<<<<<< HEAD
  // Kui on vaja logida sql päringut:
  //debug: true,
=======
>>>>>>> 46248cb4e12babb92ef80d11bab89b4d14137dc1
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