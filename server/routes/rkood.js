const router = require("express").Router();

const rkoodCont = require("../controllers/rkoodCont");
//const abiks = require('../utils/utils');

//const {isLoggedIn} = abiks;

/* -------------------------------------------------------------------------- */
/*                                    Test                                    */
/* -------------------------------------------------------------------------- */
router.get("/test", (req, res) => res.status(200).send("rkood TEST"));

/* -------------------------------------------------------------------------- */
/*                               Täna tööl kokku                              */
/* -------------------------------------------------------------------------- */
router.get("/tanatool/:asukoht", (reg, res, next) => rkoodCont.tanaTool(reg, res, next));

/* -------------------------------------------------------------------------- */
/*                               Täna tööl list                               */
/* -------------------------------------------------------------------------- */
router.get("/tanatoollist/:asukoht", (reg, res, next) =>
  rkoodCont.tanaToolList(reg, res, next)
);

/* -------------------------------------------------------------------------- */
/*                               Täna pole tööl                               */
/* -------------------------------------------------------------------------- */
router.get("/tanapoletool/:asukoht", (reg, res, next) =>
  rkoodCont.tanaPoleTool(reg, res, next)
);

/* -------------------------------------------------------------------------- */
/*                           Täna pole tööl nimekiri                          */
/* -------------------------------------------------------------------------- */
router.get("/tanapolelist/:asukoht", (reg, res, next) =>
  rkoodCont.tanaPoleToolList(reg, res, next)
);

/* -------------------------------------------------------------------------- */
/*                            Tana aktiivsed grupid                           */
/* -------------------------------------------------------------------------- */
router.get("/tanagrupp/:ggrupp", (req, res, next) =>
  rkoodCont.tanaAktGrupp(req, res, next)
);

/* -------------------------------------------------------------------------- */
/*                                  Otsi tööd                                 */
/* -------------------------------------------------------------------------- */
router.get(
  "/otsiKoodi/leping/:lepnr/too/:too/elemendid/:elem",
  (req, res, next) => rkoodCont.otsiTood(req, res, next)
);

/* -------------------------------------------------------------------------- */
/*                                 Töötaja TID                                */
/* -------------------------------------------------------------------------- */
router.get("/tootaja/:tid", (req, res, next) =>
  rkoodCont.tootaja(req, res, next)
);

/* -------------------------------------------------------------------------- */
/*                               töötaja grupid                               */
/* -------------------------------------------------------------------------- */
router.get("/tootajagrupid", (req, res, next) =>
  rkoodCont.tootajagrupp(req, res, next)
);

/* -------------------------------------------------------------------------- */
/*                                  Kes tegi                                  */
/* -------------------------------------------------------------------------- */
router.get("/kestegi/:jid", (req, res, next) =>
  rkoodCont.kesTegi(req, res, next)
);
/* -------------------------------------------------------------------------- */
/*                                Elemendi info                               */
/* -------------------------------------------------------------------------- */
router.get("/eleminfo/:jid", (req, res, next) =>
  rkoodCont.elemInfo(req, res, next)
);

/* -------------------------------------------------------------------------- */
/*                             Elemendi statistika                            */
/* -------------------------------------------------------------------------- */
router.get("/elemstats/:jid", (req, res, next) =>
  rkoodCont.elemStats(req, res, next)
);

/* -------------------------------------------------------------------------- */
module.exports = router;
