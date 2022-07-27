/**
*Create router instance
*/
const router = require('express').Router();

/**
*Module dependencies
*/

const usersCont = require('../controllers/userCont');
const abiks = require('../utils/utils');

/**
*Module Variables
*/

const {
  allUsers,
  edituser,
  newuser,
  user,
    kasEmail,
  otsiFirmat,
  otsi,
  delPilt,
  lisaPilt,
  pildiCorrect,
} = usersCont;

const { isLoggedIn } = abiks;
/**
*Middleware
*/

router.get('/test', isLoggedIn, (req, res) => res.status(200).send('TEST'));

//
// ──────────────────────────────────────────────────────────────────── I ──────────
//   :::::: K O I K   K A S U T A J A D : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────
//
router.get('/', (req, res, next) => allUsers(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────

//
// ──────────────────────────────────────────────────────────────── I ──────────
//   :::::: U U S   K A S U T A J A : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────
//
router.post('/register', (req, res, next) => newuser(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────

//
// ────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: M U U D A   K A S U T A J A T : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────
//
router.put('/edit/:tid', (req, res, next) => edituser(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────

//
// ──────────────────────────────────────────────────────── I ──────────
//   :::::: K A S U T A J A : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────
//
router.get('/:tid', (req, res, next) => user(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────

//
// ────────────────────────────────────────────────────────────── I ──────────
//   :::::: O T S I   E M A I L I : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────
//
router.get('/email/:email', (req, res, next) => kasEmail(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────
//
// ────────────────────────────────────────────────────────────── I ──────────
//   :::::: O T S I   F I R M A T : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────
//
router.get('/otsifirma/:firma', (req, res, next) => otsiFirmat(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────
//
// ────────────────────────────────────────────────── I ──────────
//   :::::: O T S I N : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────
//
router.get('/otsi/:otsi', isLoggedIn, (req, res, next) => otsi(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────
//
// ────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: K U S T U T A M E   P I L D I : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────
//
router.delete('/delpic/:pilt', (req, res, next) => delPilt(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────
//
// ──────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: L I S A M E   M U U D A M E   P I L T I : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────────────────
//
router.post('/editpic/:id', (req, res, next) => lisaPilt(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────
//
// ────────────────────────────────────────────────────────────── I ──────────
//   :::::: F I L I D E   L I S T : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────
//
router.get('/pildid/prygi', (req, res, next) => pildiCorrect(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────


/**
*Export Module
*/
module.exports = router;
