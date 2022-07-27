const router = require('express').Router();

const rkoodCont = require('../controllers/rkoodCont');
//const abiks = require('../utils/utils');


//const {isLoggedIn} = abiks;


/* -------------------------------------------------------------------------- */
/*                                    Test                                    */
/* -------------------------------------------------------------------------- */
router.get('/test', (req, res) => res.status(200).send('rkood TEST'));

/* -------------------------------------------------------------------------- */
/*                               Täna tööl kokku                              */
/* -------------------------------------------------------------------------- */
router.get('/tanatool', (reg, res, next) => rkoodCont.tanaTool(reg, res, next));

/* -------------------------------------------------------------------------- */
/*                               Täna tööl list                               */
/* -------------------------------------------------------------------------- */
router.get('/tanatoollist', (reg, res, next) => rkoodCont.tanaToolList(reg, res, next));

/* -------------------------------------------------------------------------- */
/*                               Täna pole tööl                               */
/* -------------------------------------------------------------------------- */
router.get('/tanapoletool', (reg, res, next) => rkoodCont.tanaPoleTool(reg, res, next));

/* -------------------------------------------------------------------------- */
/*                           Täna pole tööl nimekiri                          */
/* -------------------------------------------------------------------------- */
router.get('/tanapolelist', (reg, res, next) => rkoodCont.tanaPoleToolList(reg, res, next));

/* -------------------------------------------------------------------------- */
/*                            Tana aktiivsed grupid                           */
/* -------------------------------------------------------------------------- */
router.get('/tanagrupp/:ggrupp', (req, res, next) => rkoodCont.tanaAktGrupp(req, res, next));

/* -------------------------------------------------------------------------- */
/*                                 Töötaja TID                                */
/* -------------------------------------------------------------------------- */
router.get('/tootaja/:tid', (req, res, next) => rkoodCont.tootaja(req, res, next));

/* -------------------------------------------------------------------------- */
/*                               töötaja grupid                               */
/* -------------------------------------------------------------------------- */
router.get('/tootajagrupid', (req, res, next) => rkoodCont.tootajagrupp(req, res, next));


/* -------------------------------------------------------------------------- */
module.exports = router;