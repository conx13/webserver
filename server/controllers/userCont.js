/* eslint-disable no-console */
/**
 *Module dependencies
 */
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const sql = require('mssql');

//validator:
const { check, validationResult } = require('express-validator');

const abiks = require('../utils/utils');
const knex = require('../config/knex');

const sqlConfig = {
  user: 'Hillar',
  password: 'conx13',
  database: 'Ribakood',
  server: '10.0.30.2',
  options: {
    encrypt: false, // Disable SSL/TLS
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// paneme paika piltide asukoha
const pildiPath = path.join(__dirname, '../public/pildid/userPics/');
// sätime paika fili nime ja asukoha
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pildiPath);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.substring(
      file.originalname.lastIndexOf('.'),
      file.originalname.length
    );
    cb(null, `${Date.now()}${ext}`);
  },
});
// laeme pildi üles, eelnimetatud kausta ja nimega
const upload = multer({ storage }).single('pilt');

// const passport = require('../config/passport');

/**
 *Module Variables
 */
const saltRounds = 10;
const { resizePilt } = abiks;

//
// ──────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: L O O M E   U U E   K A S U T A J A : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────────────
//
const newuser = async (req, res, next) => {
  if (!req.body.firma || !req.body.email || !req.body.password) {
    return next(new Error('Andmed on puudu!'));
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
    console.log('bcrypt error!');
    return next(error);
  }

  return knex('users')
    .insert(user)
    .then(() => {
      res.json({
        status: true,
        message: 'Uus kasutaja on lisatud!',
      });
    })
    .catch((err) => next(err));
};
// ────────────────────────────────────────────────────────────────────────────────

//
// ────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: M U U D A M E   TÖÖTAJAT: :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────────
//put('/edit/:id')
/* Et selleks et saada teada, kas email on olemas, teen async funktsiooni */
const edituser = async (req, res, next) => {
  if (!req.params.tid) {
    console.log('ID puudu');
    return next(new Error('Id on puudu'));
  }
  const updateList = req.body;
  // Tekitame kogu bodys array
  /*   console.log(req.body, "req.body");
  Object.keys(req.body).forEach((key) => {
    updateList[key] = req.body[key];
  }); */
  // Kui on parool, siis krüptime ära
  if (updateList.todate) {
    try {
      updateList.todate = new Date(updateList.todate);
    } catch (error) {
      console.log('kpv formaat vale');
      return next(error);
    }
  }
  if (updateList.password) {
    try {
      // ootame kuni on kryptitud ja lisame arraysse
      // updateList.password = await bcrypt.hash();
      updateList.password = await bcrypt.hash(
        updateList.password.trim(),
        saltRounds
      );
    } catch (error) {
      console.log('bcryp error!');
      return next(error);
    }
  }
  console.log(updateList, 'LIST');
  knex('tootajad')
    .where('tid', req.params.tid)
    .update(updateList)
    .then(() => {
      res.status(200).json({
        status: true,
        message: 'Töötaja andmed on muudetud!',
      });
    })
    .catch((err) => next(err));
  return null;
};
// ────────────────────────────────────────────────────────────────────────────────
//
// ────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: N A I T A M E   TÖÖTAJAT: :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────────
//get('/user/:tid')

const tootaja = async (req, res, next) => {
  if (!req.params.tid) {
    console.log('Kasutaja ID puududb!');
    return next(new Error('Kasutaja ID puududb!'));
  }
  try {
    let pool = await sql.connect(sqlConfig);
    let data = await pool
      .request()
      .input('tid', sql.NVarChar, req.params.tid)
      .query(
        'select * from w_rk_tootjad_lyh with (noexpand) where tid = @tid '
      );
    res.json(data.recordset);
  } catch (err) {
    return next(new Error(err));
  }
};
/* -------------------------------------------------------------------------- */
/*                        Kõik tööaja grupidde list                           */
/* -------------------------------------------------------------------------- */

const tootajaAjaGrupp = (req, res, next) => {
  //console.log('Tootaja toogrupp');
  knex
    .select(
      'aid as id',
      'nimi',
      knex.raw("'Lõuna ' + Llopp +'-'+ Lalgus as markus")
    )
    //.select("aid as id", "nimi", knex.raw("Test:" + "Lalgus"))
    .from('ajad')
    .orderBy('nimi')
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                             Töötaja aja grupid                             */
/* -------------------------------------------------------------------------- */
const tootajaTooGrupp = (req, res, next) => {
  knex
    .select('toogrupp_id as id', 'toogrupp_nimi as nimi')
    .from('toogrupp')
    .orderBy('toogrupp_nimi')
    .then((rows) => res.status(200).json(rows))
    .catch((err) => next(err));
};
/* -------------------------------------------------------------------------- */
/*                               Töötaja asukoht                              */
/* -------------------------------------------------------------------------- */
const tootajaAsukoht = (req, res, next) => {
  knex
    .select('id', 'nimi')
    .from('asukoht')
    .orderBy('nimi')
    .then((rows) => res.status(200).json(rows))
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                                Töötaja firma                               */
/* -------------------------------------------------------------------------- */
const tootajaFirmad = (req, res, next) => {
  knex
    .select('fgid as id', 'nimi')
    .from('firmagrupp')
    .orderBy('nimi')
    .then((rows) => res.status(200).json(rows))
    .catch((err) => next(err));
};
/* -------------------------------------------------------------------------- */
/*                         Otsime viimati aktiivse aja                        */
/* -------------------------------------------------------------------------- */
const viimatiAktiivne = (req, res, next) => {
  return knex('result')
    .first('start')
    .where('tid', req.params.tid)
    .orderBy('start', 'desc')
    .then((rows) => res.status(200).json(rows))
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                           Töötaja ajagrupid kõik                           */
/* -------------------------------------------------------------------------- */
const tooAjaGrupp = (req, res, next) => {
  return knex('ajad')
    .first('Tooalgus', 'Toolopp', 'Lalgus', 'Llopp')
    .innerJoin('tootajad', 'ajad.aid', 'tootajad.ajagupp')
    .where('tootajad.tid', req.params.tid)
    .then((rows) => res.status(200).json(rows))
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                      Lõpetame töötaja olemasoleva töö                      */
/* -------------------------------------------------------------------------- */
/*
rid
stop
result
*/
const tooLopp = async (req, res, next) => {
  // Define validation rules
  const validationRules = [
    check('stop')
      .notEmpty()
      .withMessage('Stop on tyhi')
      .custom((value) => {
        const regex = /^\d{4}-\d{2}-\d{2}(?:T|\s)\d{2}:\d{2}(?::\d{2})?$/;
        if (!regex.test(value)) {
          throw new Error('Stop peab olema YYYY-MM-DD[T ]HH:MM');
        }
        return true;
      }),
    check('result')
      .notEmpty()
      .withMessage('Result on tyhi')
      .isNumeric()
      .withMessage('Result peab olema nr!'),
  ];
  // Validate the request body
  await Promise.all(validationRules.map((rule) => rule.run(req)));
  const errors = validationResult(req);
  //Kui ei ole errorit
  if (!errors.isEmpty()) {
    console.error(errors.array(), 'Töö lõpp ERROR');
    const errorMessages = errors.array().map((error) => error.msg);
    return res.status(400).json(errorMessages);
  }
  try {
    await knex('result')
      .where({ rid: req.params.rid })
      .update({
        stop: req.body.stop,
        result: req.body.result,
        kasutaja: req.user.email, // Add logged-in user email
      })
      .then(() => res.status(200).json('Ok'));
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/*                          Lisame töötajale uue töö                          */
/* -------------------------------------------------------------------------- */
//tid
//jid
//start
const uusToo = async (req, res, next) => {
  // Define validation rules
  const validationRules = [
    check('tid')
      .notEmpty()
      .withMessage('tid is required')
      .isNumeric()
      .withMessage('tid must be a number'),
    check('jid')
      .notEmpty()
      .withMessage('jid is required')
      .isNumeric()
      .withMessage('jid must be a number'),
    check('start')
      .notEmpty()
      .withMessage('Start on tyhi')
      .custom((value) => {
        const regex = /^\d{4}-\d{2}-\d{2}(?:T|\s)\d{2}:\d{2}(?::\d{2})?$/;
        if (!regex.test(value)) {
          throw new Error('Start peab olema YYYY-MM-DD[T ]HH:MM');
        }
        return true;
      }),
  ];
  // Validate the request body
  await Promise.all(validationRules.map((rule) => rule.run(req)));
  const errors = validationResult(req);

  // Check for validation errors
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    return res.status(400).json(errorMessages);
  }
  try {
    knex('result')
      .insert({
        tid: req.params.tid,
        jid: req.body.jid,
        start: req.body.start,
        kasutaja: req.user.email,
      })
      .then(() => res.status(200).json('Ok'));
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────────────────

//
// ──────────────────────────────────────────────────────────────────── I ──────────
//   :::::: K O I K   K A S U T A J A D : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────
//router.get('/')
const allUsers = (req, res) =>
  knex('users')
    .select(
      'id',
      'enimi',
      'pnimi',
      'email',
      'firma',
      'mob',
      'roll',
      'markus',
      'todate',
      'pilt'
    )
    .then((row) => {
      res.json(row);
    });
// ────────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────────────
//
// ──────────────────────────────────────────────────── I ──────────
//   :::::: O T S I M E : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────
//'/otsi/:otsi/:akt'
/**
 * @param {Text} otsi - otsi text
 * @param {Text} akt - kas ainult aktiivsed
 * @param {Text} asukoht - description
 */

const otsi = async (req, res, next) => {
  if (!req.params.otsi) {
    return next(new Error('Otsing puudub!'));
  }
  let akt = '%';
  if (req.params.akt) {
    akt = req.params.akt;
  }
  try {
    let pool = await sql.connect(sqlConfig);
    let data = await pool
      .request()
      .input('akt', sql.NVarChar, akt)
      .input('asukoht', sql.Int, req.params.asukoht)
      .input('otsiText', sql.NVarChar, `%${req.params.otsi}%`)
      .query(
        'select * from w_rk_tootjad_lyh with (noexpand) where aktiivne = @akt and asukoht_id = @asukoht and (enimi like @otsiText or pnimi like @otsiText) '
      );
    res.json(data.recordset);
  } catch (err) {
    return next(new Error(err));
    //next(err);
  }
};
// ────────────────────────────────────────────────────────────────────────────────

//
// ────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: K U S T U T A M E   P I L D I : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────
//

const delPilt = async (req, res, next) => {
  if (!req.query.pilt) {
    return next(new Error('Pilt puudub!'));
  }
  const otsiPilt = req.query.pilt;

  const kustutaFail = async () => {
    try {
      await fs.remove(`${pildiPath}${otsiPilt}`);
      // await delFile(`${pildiPath}${otsiPilt}`);
      return res.status(200).send({
        status: true,
        message: 'Pilt on kustutatud!',
      });
    } catch (error) {
      console.error('DEL ERROR');
      return next(error);
    }
  };

  const delDbPilt = async () => {
    try {
      const pool = await sql.connect(sqlConfig);
      const request = pool.request();
      request.input('pilt', sql.NVarChar, otsiPilt);
      request.query(
        'UPDATE dbo.tootajad SET pilt=null WHERE pilt=@pilt',
        (err, result) => {
          if (err) {
            console.error(err.message, 'sqli viga');
            return next(err.message);
          } else {
            if (result.rowsAffected > 0) {
              // if (result.rowsAffected) {
              //Kui andmebaasit leidsime faili ja
              //kustatsime siis kustuatme ka päris faili
              kustutaFail();
            } else {
              return next('Pilti ei kustatud.');
            }
          }
        }
      );
    } catch (err) {
      console.error(err.message, 'msql ühnenduses viga');
      return next(err.message);
    }
  };
  return delDbPilt();
};
// ────────────────────────────────────────────────────────────────────────────────
//
// ──────────────────────────────────────────────────────────────── I ──────────
//   :::::: L I S A M E   P I L D I : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────
//
const lisaPilt = async (req, res, next) => {
  if (!req.params.id) {
    return next(new Error('Kasutaja ID puudub!'));
  }

  // 1) Laeme pildi üles serverisse
  const piltUpload = () =>
    new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          console.log(err, 'Upload error');
          reject(err);
        }
        resolve(true);
      });
    });

  // Otsime ID järgi kas on DB-s pilti
  const otsiDbPildiName = async (id) =>
    knex('tootajad')
      .select('pilt')
      .where('tid', id)
      .then((rows) => {
        if (rows.length > 0) {
          return rows[0].pilt;
        }
        return null;
      });

  // Muudame andmebaasis faili nime
  const muudaDbFileName = async (id, pilt) => {
    await knex('tootajad').where('tid', id).update('pilt', pilt);
  };

  const muudaPilt = async () => {
    let mess;
    try {
      const pathTemp = `${pildiPath}${'Temp.jpeg'}`;
      // Laeme pildi serverisse
      await piltUpload();
      // Otsime ID järgi pildi DB-st
      const vanaPilt = await otsiDbPildiName(req.params.id);
      if (vanaPilt) {
        // Kui on vana pilt serveris siis kustutame
        await fs.remove(`${pildiPath}${vanaPilt}`);
        // await delFile(`${pildiPath}${vanaPilt}`);
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
          mess = req.file.filename;
        } else {
          mess = req.file.filename;
        }
      } else {
        // kui faili ei ole, siis kustutame DB-s nime
        await muudaDbFileName(req.params.id, null);
        mess = 'Pilt on kustutatud!';
      }
      return res.status(200).send(mess);
    } catch (error) {
      return next(error);
    }
  };
  return muudaPilt();
};
//
// ──────────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: K U S T U T A M E   D B - S   M I T T E   L E I D U V A D   F A I L I D : :  :         :
// ─────────────────────────────────────────────────────────────────────────────────────────────────
//
const pildiCorrect = async (req, res, next) => {
  const nimekiriDb = [];
  const nimekiri = [];
  let teade;

  // Tekitame db-s olevatest piltidest nimekirja
  const listDb = async () => {
    await knex('users')
      .select('pilt')
      .orderBy('pilt')
      .then((rows) => {
        rows.forEach((element) => {
          if (element.pilt) {
            nimekiriDb.push(element.pilt);
          }
        });
      });
  };
  const correctDbList = async () => {
    try {
      // tekitame dir failidest nimekirja
      const nimekiriFiles = await fs.readdir(pildiPath);
      console.log(nimekiriFiles, 'Failid mis on kaustas');
      // tekitabe andmebaasi nimekirja
      await listDb();
      console.log(nimekiriDb, 'Failid mis on andmebaasis');
      nimekiriFiles.sort();
      // Käime nimekirjad läbi ja kustutame ülearused failid
      nimekiriFiles.forEach((x) => {
        if (nimekiriDb.indexOf(x) === -1) {
          // tekitame nimekirja failidest mida pole db-s
          nimekiri.push(x);
          // kustutame failid mida pole db-s
          fs.remove(`${pildiPath}${x}`);
        }
      });
      if (nimekiri.length > 0) {
        teade = 'Sellised failid puudusid andmebaasis ja kustutasime!';
      } else {
        teade = 'Kõik paistab ok olema!';
      }
      return res.status(200).send({
        status: true,
        message: teade,
        data: nimekiri,
      });
    } catch (error) {
      return next(error);
    }
  };
  return correctDbList();
};

/**
 *Export Module
 */
module.exports = {
  allUsers,
  newuser,
  edituser,
  tootaja, //mssql
  tootajaTooGrupp,
  tootajaAjaGrupp,
  tootajaAsukoht,
  tootajaFirmad,
  otsi, //mssql
  delPilt,
  lisaPilt,
  pildiCorrect,
  viimatiAktiivne,
  tooAjaGrupp,
  tooLopp,
  uusToo,
};
