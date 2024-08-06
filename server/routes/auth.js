/**
 *Create router instance
 */
const router = require('express').Router();

/**
 *Module dependencies
 */
const abiks = require('../utils/utils');
const fs = require('fs');

/**
 *Module Variables
 */
const passport = require('../config/passport');

const { app } = require('../config/config');

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
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(500).send({
        status: false,
        message: 'Midagi on katki!',
      });
    }
    return req.login(user, (error) => {
      if (error) {
        return next(err);
      }
      return res.status(200).send({
        status: true,
        user,
      });
    });
  })(req, res);
});

/* -------------------------------------------------------------------------- */
/*                               Kas on loginud                               */
/* -------------------------------------------------------------------------- */
router.get('/authstatus', isLoggedIn, (req, res, next) => {
  const { user } = req;
  return res.status(200).send({
    status: true,
    user,
  });
});
/* -------------------------------------------------------------------------- */
/*                                   Logout                                   */
/* -------------------------------------------------------------------------- */
router.get('/logout', (req, res, next) => {
  console.log('LOGOUT');
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((error) => {
      if (error) {
        return next(error);
      }
      return res.status(200).send({
        status: true,
        message: 'Kasutaja on välja logitud!',
      });
    });
  });
});

router.get('/config/ootelid', (req, res, next) => {
  const ootelid = app.tooOotel;
  return res.status(200).send({
    status: true,
    ootelid,
  });
});

/**
 *Export Module
 */
module.exports = router;
