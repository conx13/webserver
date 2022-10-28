/* eslint-disable no-console */
/**
 *Module dependencies
 */
const bcrypt = require("bcrypt");
const multer = require("multer");
const fs = require("fs-extra");
const path = require("path");

const abiks = require("../utils/utils");
const knex = require("../config/mssql");

// paneme paika piltide asukoha
const pildiPath = path.join(__dirname, "../public/pildid/userPics/");
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
// ────────────────────────────────────────────────────────────────────────────────

//
// ────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: M U U D A M E   K A S U T A J A T : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────────
//put('/edit/:id')
/* Et selleks et saada teada, kas email on olemas, teen async funktsiooni */
const edituser = async (req, res, next) => {
  if (!req.params.id) {
    console.log("ID puudu");
    return next(new Error("Id on puudu"));
  }
  const updateList = {};
  // Tekitame kogu bodys array
  console.log(req.body, "req.body");
  Object.keys(req.body).forEach((key) => {
    updateList[key] = req.body[key];
  });
  // Kui on parool, siis krüptime ära
  if (updateList.todate) {
    try {
      updateList.todate = new Date(updateList.todate);
    } catch (error) {
      console.log("kpv formaat vale");
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
      console.log("bcryp error!");
      return next(error);
    }
  }
  console.log(updateList, "LIST");
  knex("users")
    .where("id", req.params.id)
    .update(updateList)
    .then(() => {
      res.status(200).json({
        status: true,
        message: "Kasutaja andmed on muudetud!",
      });
    })
    .catch((err) => next(err));
  return null;
};
// ────────────────────────────────────────────────────────────────────────────────
//
// ────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: N A I T A M E   K A S U T A J A T : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────────
//get('/:id')

const tootaja = (req, res, next) => {
  if (!req.params.tid) {
    console.log("Kasutaja ID puududb!");
    return next(new Error("Kasutaja ID puududb!"));
  }
  return knex("w_rk_tootajad")
    .where("TID", req.params.tid)
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
/*                               Töötaja töö grupid                           */
/* -------------------------------------------------------------------------- */

const tootajaAjaGrupp = (req, res, next) => {
  //console.log('Tootaja toogrupp');
  knex
    .select("aid as id", "nimi", knex.raw("'Lõuna ' + Llopp +'-'+ Lalgus as markus"))
    //.select("aid as id", "nimi", knex.raw("Test:" + "Lalgus"))
    .from("ajad")
    .orderBy("nimi")
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
  .select("toogrupp_id as id", "toogrupp_nimi as nimi")
  .from("toogrupp")
  .orderBy("toogrupp_nimi")
  .then((rows) => {
    res.status(200).json(rows);
  })
  .catch((err) => next(err));
}
/* -------------------------------------------------------------------------- */
/*                               Töötaja asukoht                              */
/* -------------------------------------------------------------------------- */
const tootajaAsukoht = (req, res, next) => {
  knex
  .select("id", "nimi")
  .from("asukoht")
  .orderBy("nimi")
  .then((rows) => {
    res.status(200).json(rows);
  })
  .catch((err) => next(err));
}

/* -------------------------------------------------------------------------- */
/*                                Töötaja firma                               */
/* -------------------------------------------------------------------------- */
const tootajaFirmad = (req, res, next) => {
  knex
  .select("fgid as id", "nimi")
  .from("firmagrupp")
  .orderBy("nimi")
  .then((rows) => {
    res.status(200).json(rows);
  })
  .catch((err) => next(err));
}


// ────────────────────────────────────────────────────────────────────────────────

//
// ──────────────────────────────────────────────────────────────────── I ──────────
//   :::::: K O I K   K A S U T A J A D : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────
//router.get('/')
const allUsers = (req, res) =>
  knex("users")
    .select(
      "id",
      "enimi",
      "pnimi",
      "email",
      "firma",
      "mob",
      "roll",
      "markus",
      "todate",
      "pilt"
    )
    .then((row) => {
      res.json(row);
    });
// ────────────────────────────────────────────────────────────────────────────────

//
// ──────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: K O N T R O L L I M E   E M A I L I : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────────────
//get('/email/:email')
const kasEmail = (req, res, next) => {
  if (!req.params.email) {
    return next(new Error("Emaili ei ole!"));
  }
  return knex("users")
    .where("email", req.params.email)
    .then((row) => {
      if (row.length === 0) {
        return res.status(200).send({
          status: false,
          message: "Emaili ei ole baasis!",
        });
      }
      return res.status(200).send({
        status: true,
        message: "Email on kasutusel!",
      });
    })
    .catch((err) => next(err));
};
// ────────────────────────────────────────────────────────────────────────────────

//
// ────────────────────────────────────────────────────────────────── I ──────────
//   :::::: O T S I M E   F I R M A T : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────
//'/otsifirma/:firma'
const otsiFirmat = (req, res, next) => {
  if (!req.params.firma) {
    return next(new Error("Firmat ei ole!"));
  }
  return knex("users")
    .select(
      "id",
      "enimi",
      "pnimi",
      "email",
      "firma",
      "mob",
      "roll",
      "markus",
      "todate",
      "pilt"
    )
    .where("firma", "like", `%${req.params.firma}%`)
    .then((rows) => res.json(rows))
    .catch((err) => next(err));
};
// ────────────────────────────────────────────────────────────────────────────────
//
// ──────────────────────────────────────────────────── I ──────────
//   :::::: O T S I M E : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────
//'/otsi/:otsi/:akt'

const otsi = (req, res, next) => {
  if (!req.params.otsi) {
    return next(new Error("Otsing puudub!"));
  }
  const otsiText = `%${req.params.otsi}%`;
  let akt = "";

  if (!req.params.akt) {
    akt = "%";
  } else {
    akt = req.params.akt;
  }
  return knex("w_rk_tootajad")
    .where("aktiivne", "like", akt)
    .where((w) =>
      w
        .orWhere("enimi", "like", otsiText)
        .orWhere("pnimi", "like", otsiText)
        .orWhere("firma", "like", otsiText)
        .orWhere("toogrupp_nimi", "like", otsiText)
        .orWhere("Ajanimi", "like", otsiText)
    )
    .then((rows) => res.json(rows))
    .catch((err) => next(err));
};
// ────────────────────────────────────────────────────────────────────────────────

//
// ────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: K U S T U T A M E   P I L D I : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────
//

const delPilt = async (req, res, next) => {
  console.log("DEL pilt");
  if (!req.params.pilt) {
    return next(new Error("Pilt puudub!"));
  }
  const otsiPilt = req.params.pilt;

  const delDbPilt = async () => {
    await knex("tootajad")
      .where("pilt", otsiPilt)
      .update("pilt", null)
      .catch((err) => {
        throw err;
      });
  };
  const kustutaFail = async () => {
    try {
      await delDbPilt(otsiPilt);
      await fs.remove(`${pildiPath}${otsiPilt}`);
      // await delFile(`${pildiPath}${otsiPilt}`);
      return res.status(200).send({
        status: true,
        message: "Pilt on kustutatud!",
      });
    } catch (error) {
      console.log("DEL ERROR");
      return next(error);
    }
  };
  return kustutaFail();
};
// ────────────────────────────────────────────────────────────────────────────────
//
// ──────────────────────────────────────────────────────────────── I ──────────
//   :::::: L I S A M E   P I L D I : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────
//
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
    knex("tootajad")
      .select("pilt")
      .where("tid", id)
      .then((rows) => {
        if (rows.length > 0) {
          return rows[0].pilt;
        }
        return null;
      });

  // Muudame andmebaasis faili nime
  const muudaDbFileName = async (id, pilt) => {
    await knex("tootajad").where("tid", id).update("pilt", pilt);
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
        mess = "Pilt on kustutatud!";
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
    await knex("users")
      .select("pilt")
      .orderBy("pilt")
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
      console.log(nimekiriFiles, "Failid mis on kaustas");
      // tekitabe andmebaasi nimekirja
      await listDb();
      console.log(nimekiriDb, "Failid mis on andmebaasis");
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
        teade = "Sellised failid puudusid andmebaasis ja kustutasime!";
      } else {
        teade = "Kõik paistab ok olema!";
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
  tootaja,
  tootajaTooGrupp,
  tootajaAjaGrupp,
  tootajaAsukoht,
  tootajaFirmad,
  kasEmail,
  otsiFirmat,
  otsi,
  delPilt,
  lisaPilt,
  pildiCorrect,
};
