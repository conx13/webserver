module.exports = sqlConfig = {
  user: 'Hillar',
  password: 'conx13',
  database: 'Ribakood',
  server: '10.0.30.2',
  options: {
    encrypt: false, // Disable SSL/TLS
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};
