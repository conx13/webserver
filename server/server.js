// const history = require('connect-history-api-fallback');

const app = require('./app');

// app.use(history());
// Tekitame serveri

const port = app.get('port');

app.listen(port, () => console.log(`Server käib ja kuulab porti: ${port} mode.`));
