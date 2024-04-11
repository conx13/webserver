// const history = require('connect-history-api-fallback');
const https = require('https');
const fs = require('fs');

const app = require('./app');

// Read SSL certificate and key files
const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.crt'),
};

// app.use(history());
// Tekitame serveri

const port = app.get('port');

https.createServer(options, app).listen(port, () => {
  console.log(`HTTPS server on käivitatud ja kuulab ${port}-i`);
});
/* app.listen(port, () =>
  console.log(`Server käib ja kuulab porti: ${port} mode.`)
); */
