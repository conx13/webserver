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
const basicAuth = require('express-basic-auth')

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

/**
*Module Settings and Config
*/
app.set('port', port);

/**
*Middleware
*/

app.use(morgan('[:date[clf]] :method :url :status :response-time ms - :res[content-length]'));
//app.use(morgan('dev'));
app.use(cors());
app.use(bParser.json());
app.use(bParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// et /docs saame kätte 'pildid' kausta
app.use('/api/pics', express.static(path.join(__dirname, 'public/pildid/userPics')));
app.use('/docs', express.static(path.join(__dirname, 'lepingdata')));
//Ajutiselt kasutame basicAuth funktsiooni
app.use(basicAuth({
  users: {
      'matek': '123£-UYh4-8UXx',
  }
}))

app.use(session({
  genid: () => {
    console.log('Kasutaja ei ole sisse loginud!');
    return uuidv4();
  }, // use uuid for session id
  name: 'webProjekt.sess',
  secret: 'salajane kraam',
  resave: false,
  saveUninitialized: false,
  // lükkame logimist 7 päeva võrra edasi
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());
// app.use(history());

/**
*Routes
*/
app.use('/api/auth', login);
app.use('/api/users', users);
app.use('/api/test', test);
app.use('/api/rkood', rkood);
app.use('/api/projekt', projekt);


/**
 * Error
 */
app.use((err, res,) => {
  console.log(err.message, 'ERROR app.js');
  return res.sendStatus(500).json(err.message);
  //return res.status(500).send(err.message);
});
module.exports = app;
