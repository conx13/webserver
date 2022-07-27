/**
*Module dependencies
*/
const sharp = require('sharp');

// ────────────────────────────────────────────────────────────────────────────────

//
// ────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: A B I F U N K T S I O O N I D : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────
//
// Kontrollime üle kas on sisse loginud ja kas ei ole vahepeal vanaks läinud
const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    if (req.user.todate) {
      const aktkpv = new Date(req.user.todate);
      aktkpv.setHours(23); // Lisame tunnid, et kell ei oleks väiksem praegusest
      const tanakpv = Date.now();// Tänane kpv
      if (aktkpv < tanakpv) { //Kui on väiksem kui täna
        res.clearCookie("webProjekt.sess");
        return res.status(401).send({
          status: false,
          message: 'Konto ei ole enam aktiivne!\n Võta ühendust projektijuhiga!\n',
        });
      }
    }
    return next();
  }
  return res.status(401).send({
    status: false,
    message: 'Kasutaja ei ole sisse loginud!\n',
  });
};

//
// ──────────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: P I L D I   S U U R U S E   M U U T M I N E : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────────────────────
//
// Muudame faili suurust
const resizePilt = async (origPilt, resizedPilt) => {
  await sharp(origPilt)
    .rotate()
    .resize(500)
    .toFile(resizedPilt)
    .catch((err) => {
      console.log(err, 'resizeError');
      throw (err);
    });
};

/**
*Export Module
*/
module.exports = {
  isLoggedIn,
  resizePilt,
};
