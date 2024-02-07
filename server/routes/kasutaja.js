const router=require('express').Router()
//const abiks = require('../utils/utils');

const kasutajaCont=require('../controllers/kasutajaCont')
const {getKasutaja, lisaPilt, getAsukohad, muudameKasutajat, viimatiAktiivne}=kasutajaCont

//const { isLoggedIn } = abiks;

/* -------------------------------------------------------------------------- */
/*                              Kasutaja ID järgi                             */
/* -------------------------------------------------------------------------- */
router.get('/:id', (req, res, next)=>getKasutaja(req, res, next))

/* -------------------------------------------------------------------------- */
/*                        Muudame lisame kasutaja pildi                       */
/* -------------------------------------------------------------------------- */
router.post('/muudapilt/:id',(req,res,next) => lisaPilt(req, res, next))

/* -------------------------------------------------------------------------- */
/*                               Leiame asukohad                              */
/* -------------------------------------------------------------------------- */
router.get('/asukohad/list', (req,res,next) =>getAsukohad(req,res,next))

/* -------------------------------------------------------------------------- */
/*                              Muudame kasutajat                             */
/* -------------------------------------------------------------------------- */
router.put('/edit/:id', (req, res, next)=>muudameKasutajat(req, res, next))

/* -------------------------------------------------------------------------- */
/*                         Otsime viimati aktiivse aja                        */
/* -------------------------------------------------------------------------- */
router.get('/viimatiakt/:tid', (req,res,next)=>viimatiAktiivne(req,res,next))

/* ------------------------------ Module export ----------------------------- */
module.exports=router