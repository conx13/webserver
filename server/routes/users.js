/**
 *Create router instance
 */
const router = require('express').Router();

/**
 *Module dependencies
 */
const path = require('path');
const usersCont = require('../controllers/userCont');
const abiks = require('../utils/utils');
const uploadPicture = require('../utils/upload');

const pildiPath = path.join(__dirname, '../public/pildid/userPics/');

/**
 *Module Variables
 */

const {
  allUsers,
  edituser,
  newuser,
  kasEmail,
  otsiFirmat,
  otsi,
  delPilt,
  lisaPilt,
  pildiCorrect,
  vordleFaile,
  viimatiAktiivne,
  tooAjaGrupp,
  tooLopp,
  uusToo,
} = usersCont;

const { isLoggedIn } = abiks;
/**
 *Middleware
 */

router.get('/test', isLoggedIn, (req, res) => res.status(200).send('TEST'));

//
// ──────────────────────────────────────────────────────────────────── I ──────────
//   :::::: K O I K   TÖÖTAJAD : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────
//
router.get('/', (req, res, next) => allUsers(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────

//
// ──────────────────────────────────────────────────────────────── I ──────────
//   :::::: U U S   TÖÖTAJA : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────
//
router.post('/', (req, res, next) => newuser(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────

//
// ────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: M U U D A   TÖÖTAJAT : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────
//
router.put('/:tid', (req, res, next) => edituser(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────

/* -------------------------------------------------------------------------- */
/*                                   TÖÖTAJA                                  */
/* -------------------------------------------------------------------------- */
router.get('/user/:tid', (req, res, next) => usersCont.tootaja(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────

/* -------------------------------------------------------------------------- */
/*                             Töötaja töö grupp                             */
/* -------------------------------------------------------------------------- */
router.get('/toogrupp/', (req, res, next) =>
  usersCont.tootajaTooGrupp(req, res, next)
);
//
/* -------------------------------------------------------------------------- */
/*                             Töötaja aja grupid                             */
/* -------------------------------------------------------------------------- */

router.get('/ajagrupp/', (req, res, next) =>
  usersCont.tootajaAjaGrupp(req, res, next)
);

/* -------------------------------------------------------------------------- */
/*                               Töötaja asukoht                              */
/* -------------------------------------------------------------------------- */
router.get('/asukoht', (req, res, next) =>
  usersCont.tootajaAsukoht(req, res, next)
);

/* -------------------------------------------------------------------------- */
/*                               Töötaja firmad                               */
/* -------------------------------------------------------------------------- */
router.get('/firmad', (req, res, next) =>
  usersCont.tootajaFirmad(req, res, next)
);

/* -------------------------------------------------------------------------- */
/*                         Otsime viimati aktiivse aja                        */
/* -------------------------------------------------------------------------- */
router.get('/viimatiakt/:tid', (req, res, next) =>
  viimatiAktiivne(req, res, next)
);

/* -------------------------------------------------------------------------- */
/*                       Võtame töötajale tema ajagrupid                      */
/* -------------------------------------------------------------------------- */

router.get('/tootaja/ajagrupp/:tid', (req, res, next) =>
  tooAjaGrupp(req, res, next)
);

/* -------------------------------------------------------------------------- */
/*                         Lõpetame töötaja hetke töö                         */
/* -------------------------------------------------------------------------- */

router.put('/toolopp/:rid', tooLopp);

/* -------------------------------------------------------------------------- */
/*                          Lisame töötajale uue töö                          */
/* -------------------------------------------------------------------------- */

router.post('/uustoo/:tid', (req, res, next) => uusToo(req, res, next));

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
router.get('/otsi/:otsi/:akt/:asukoht', (req, res, next) =>
  otsi(req, res, next)
);
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
router.post('/editpic/:id', (req, res, next) => {
  lisaPilt(req, res, next);
});
// ────────────────────────────────────────────────────────────────────────────────
//
// ────────────────────────────────────────────────────────────── I ──────────
//   :::::: F I L I D E   L I S T : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────
//
router.get('/pildid/prygi', (req, res, next) => vordleFaile(req, res, next));
// ────────────────────────────────────────────────────────────────────────────────

/**
 *Export Module
 */
module.exports = router;
