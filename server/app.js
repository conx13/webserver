/**
 *Module dependencies
 */
const express = require('express');

var cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const bParser = require('body-parser');
const session = require('express-session');
const { v4: uuidv4 } = require('uuid');
//const basicAuth = require('express-basic-auth')

// const history = require('connect-history-api-fallback');
const passport = require('./config/passport');

/**
 *Create app instance
 */
const app = express();

/**
 *Module Variables
 */
const port = process.env.PORT || 3000;

const login = require('./routes/auth');
const users = require('./routes/users');
const test = require('./routes/test');
const projekt = require('./routes/projekt');
const rkood = require('./routes/rkood');
const kasutaja = require('./routes/kasutaja');

/**
 *Module Settings and Config
 */
app.set('port', port);

/**
 *Middleware
 */

app.use(
  morgan(
    '[:date[clf]] :method :url :status :response-time ms - :res[content-length]'
  )
);
//app.use(morgan('dev'));
app.use(cors());
app.use(bParser.json());
app.use(bParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// et /docs saame kätte 'pildid' kausta
app.use(
  '/api/pics',
  express.static(path.join(__dirname, 'public/pildid/userPics'))
);
app.use(
  '/api/kasutaja/pics',
  express.static(path.join(__dirname, 'public/pildid/kasutajaPics'))
);
app.use('/docs', express.static(path.join(__dirname, 'lepingdata')));

app.use(
  '/api/app/pics',
  express.static(path.join(__dirname, 'public/pildid/app'))
);
//Ajutiselt kasutame basicAuth funktsiooni
/* app.use(basicAuth({
  users: {
      'matek': '123£-UYh4-8UXx',
  }
})) */

app.use(
  session({
    genid: () => {
      console.log('Session: Kasutaja ei ole sisse loginud!');
      return uuidv4();
    }, // use uuid for session id
    name: 'webProjekt.sess',
    secret: 'salajane kraam',
    resave: false,
    saveUninitialized: false,
    // lükkame logimist 7 päeva võrra edasi
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());
// app.use(history());

/**
 *Routes
 */
//TEST
app.get('/api/kama', (req, res) => {
  res.send('Tere tulemast HTTPS serverisse!');
});

app.use('/api/auth', login);
app.use('/api/users', users);
app.use('/api/test', test);
app.use('/api/rkood', rkood);
app.use('/api/projekt', projekt);
app.use('/api/kasutaja', kasutaja);

/**
 * Error
 */
app.use((err, req, res, next) => {
  console.error(err.message || err, 'ERROR!');
  return res.status(err.status || 500).send(err.message || 'Päring on vale!');
});
module.exports = app;
