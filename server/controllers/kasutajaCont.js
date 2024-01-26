const bcrypt = require("bcrypt");
const knex = require("../config/mssql");
const path = require("path");
const fs = require("fs-extra");
const abiks = require("../utils/utils");
const multer = require("multer");


const saltRounds = 10;
const { resizePilt } = abiks;

// sätime paika fili nime ja asukoha
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pildiPath);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.substring(
      file.originalname.lastIndexOf("."),
      file.originalname.length
    );
    cb(null, `${Date.now()}${ext}`);
  },
});
// laeme pildi üles, eelnimetatud kausta ja nimega
const upload = multer({ storage }).single("pilt");

// paneme paika piltide asukoha
const pildiPath = path.join(__dirname, "../public/pildid/userPics/");
/* -------------------------------------------------------------------------- */
/*                             Lisame uue kasutaja                            */
/* -------------------------------------------------------------------------- */

const uusKasutaja = async (req, res, next) => {
    if (!req.body.firma || !req.body.email || !req.body.password) {
      return next(new Error("Andmed on puudu!"));
    }
    const user = {};
    Object.keys(req.body).forEach((key) => {
      user[key] = req.body[key].trim();
    });
    /*  enimi    TEXT (20),
        pnimi    TEXT (30),
        email    TEXT (30) NOT NULL UNIQUE,
        firma    TEXT (30),
        mob      INTEGER (30),
        roll     TEXT (20) NOT NULL,
        desc     TEXT (50),
        password TEXT (100) NOT NULL,
        pilt     TEXT (30),
        jrk      INTEGER,
        todate   NUMERIC (20)  */
    // if (req.file) {
    //   user.pilt = req.file.filename;
    // }
    try {
      // ootame kuni on kryptitud ja lisame arraysse
      // updateList.password = await bcrypt.hash();
      user.password = await bcrypt.hash(user.password.trim(), saltRounds);
    } catch (error) {
      console.log("bcrypt error!");
      return next(error);
    }
  
    return knex("users")
      .insert(user)
      .then(() => {
        res.json({
          status: true,
          message: "Uus kasutaja on lisatud!",
        });
      })
      .catch((err) => next(err));
  };

 /* -------------------------------------------------------------------------- */
 /*                                 getKasutaja                                */
 /* -------------------------------------------------------------------------- */
//get('/:id'
const getKasutaja = (req, res, next) => {
  if (!req.params.id) {
    console.log("Kasutaja ID puududb!");
    return next(new Error("Kasutaja ID puududb!"));
  }
  return knex("wusers")
  .select('id',
  'enimi',
  'pnimi',
  'email',
  'firma_id',
  'asukoht_id',
  'asukoht',
  'asutus',
  'mob',
  'roll',
  'markus',
  'pilt',
  'todate')
    .where("id", req.params.id)
    .then((rows) => {
      if (!rows.length) {
        res.status(500).json({
          status: false,
          message: "Sellise ID-ga kasutajat ei leia!",
        });
      } else {
        res.status(200).json(rows);
      }
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                            Muudame lisame pildi                            */
/* -------------------------------------------------------------------------- */

const lisaPilt = async (req, res, next) => {
  if (!req.params.id) {
    return next(new Error("Kasutaja ID puudub!"));
  }
  
  // 1) Laeme pildi üles serverisse
  const piltUpload = () =>
  new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          console.log(err, "Upload error");
          reject(err);
        }
        resolve(true);
      });
    });

  // Otsime ID järgi kas on DB-s pilti
  const otsiDbPildiName = async (id) =>
    knex("users")
      .select("pilt")
      .where("id", id)
      .then((rows) => {
        if (rows.length > 0) {
          return rows[0].pilt;
        }
        return null;
      });

  // Muudame andmebaasis faili nime
  const muudaDbFileName = async (id, pilt) => {
    await knex("users").where("id", id).update("pilt", pilt);
  };

  const muudaPilt = async () => {
    let mess;
    try {
      const pathTemp = `${pildiPath}${"Temp.jpeg"}`;
      // Laeme pildi serverisse
      await piltUpload();
      // Otsime ID järgi pildi DB-st
      const vanaPilt = await otsiDbPildiName(req.params.id);
      if (vanaPilt) {
        // Kui on vana pilt serveris siis kustutame
        await fs.remove(`${pildiPath}${vanaPilt}`);
      }
      if (req.file) {
        // muudame pildi suurust ja salvestama temp nimega
        await resizePilt(`${pildiPath}${req.file.filename}`, pathTemp);
        // muudame ds-s faili nime
        await muudaDbFileName(req.params.id, req.file.filename);
        // kopeerime originaali muudetud temp faliga üle
        await fs.copy(pathTemp, `${pildiPath}${req.file.filename}`);
        // await copyFile(pathTemp, `${pildiPath}${req.file.filename}`);
        if (vanaPilt) {
          mess = 'Muutsime vana pilti!';
        } else {
          mess = 'Lisasime uue pildi!';
        }
      } else {
        // kui faili ei ole, siis kustutame DB-s nime
        await muudaDbFileName(req.params.id, null);
        mess = "Pilt on kustutatud!";
      }
      return res.status(200).send(mess);
    } catch (error) {
      return next(error);
    }
  };
  return muudaPilt();
};

/* -------------------------------------------------------------------------- */
/*                              Leiame asukohad                              */
/* -------------------------------------------------------------------------- */
const getAsukohad = (req,res, next) =>{
  return knex('asukoht')
  .select('id', 'nimi')
  .orderBy('id')
  .then((rows) => {
    res.status(200).json(rows);
  })
  .catch((err) => next(err));
}


/* ------------------------------ Export module ----------------------------- */

  module.exports = {
    uusKasutaja, getKasutaja, lisaPilt, getAsukohad
}