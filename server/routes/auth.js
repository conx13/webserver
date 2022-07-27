/**
*Create router instance
*/
const router = require('express').Router();

/**
*Module dependencies
*/
const abiks = require('../utils/utils');

/**
*Module Variables
*/
const passport = require('../config/passport');

const { isLoggedIn } = abiks;

//
// ────────────────────────────────────────────────── I ──────────
//   :::::: L O G I N : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────
//

router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (info) {
      return res.status(401).send({
        status: false,
        message: info.message,
      });
    }
    if (err) { return next(err); }
    if (!user) {
      return res.status(500).send({
        status: false,
        message: 'Midagi on katki!',
      });
    }
    return req.login(user, (error) => {
      if (error) { return next(err); }
      return res.status(200).send({
        status: true,
        user,
      });
    });
  })(req, res);
});

router.get('/authstatus', isLoggedIn, (req, res) => {
  const { user } = req;
  return res.status(200).send({
    status: true,
    user,
  });
});

router.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  return res.status(200).send({
    status: true,
    message: 'Kasutaja on välja logitud!',
  });
});

/**
*Export Module
*/
module.exports = router;
