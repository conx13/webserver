const router = require('express').Router();
//const abiks = require('../utils/utils');

const kasutajaCont = require('../controllers/kasutajaCont');
const { getKasutaja, lisaPilt, delPilt, getAsukohad, muudameKasutajat } =
  kasutajaCont;

//const { isLoggedIn } = abiks;

/* -------------------------------------------------------------------------- */
/*                              Kasutaja ID järgi                             */
/* -------------------------------------------------------------------------- */
router.get('/:id', (req, res, next) => getKasutaja(req, res, next));

/* -------------------------------------------------------------------------- */
/*                        Muudame lisame kasutaja pildi                       */
/* -------------------------------------------------------------------------- */
router.post('/pilt/:id', (req, res, next) => lisaPilt(req, res, next));

/* -------------------------------------------------------------------------- */
/*                          Kustutame kasutaja pildi                          */
/* -------------------------------------------------------------------------- */
router.delete('/pilt/:id', (req, res, next) => delPilt(req, res, next));

/* -------------------------------------------------------------------------- */
/*                               Leiame asukohad                              */
/* -------------------------------------------------------------------------- */
router.get('/asukohad/list', (req, res, next) => getAsukohad(req, res, next));

/* -------------------------------------------------------------------------- */
/*                              Muudame kasutajat                             */
/* -------------------------------------------------------------------------- */
router.put('/:id', (req, res, next) => muudameKasutajat(req, res, next));

/* ------------------------------ Module export ----------------------------- */
module.exports = router;
