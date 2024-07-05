const bcrypt = require('bcrypt');
const knex = require('../config/knex');
const sqlConfig = require('../config/mssql');
const sql = require('mssql');
const path = require('path');
const fs = require('fs-extra');
const abiks = require('../utils/utils');
const multer = require('multer');
const { log, error } = require('console');

const saltRounds = 10;
const { resizePilt } = abiks;

// paneme paika piltide asukoha
const pildiPath = path.join(__dirname, '../public/pildid/kasutajaPics/');

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

/* -------------------------------------------------------------------------- */
/*                             Lisame uue kasutaja                            */
/* -------------------------------------------------------------------------- */

const uusKasutaja = async (req, res, next) => {
  if (!req.body.firma_id || !req.body.email || !req.body.password) {
    return next(new Error('Andmed on puudu!'));
  }
  const user = {};
  Object.keys(req.body).forEach((key) => {
    user[key] = req.body[key].trim();
  });

  // Vaikimisi väärtused, kui mõni väli puudub
  user.mob = user.mob || null;
  user.markus = user.jrk || null;
  user.todate = user.todate || null;
  user.pilt = user.pilt || null;

  /*   
  id,  int,  NULL
  enimi,  nvarchar, 30
  pnimi,  nvarchar, 30
  email,  nvarchar, 30
  mob,  nvarchar, 20
  roll, nvarchar, 20
  markus, nvarchar, 30
  pilt, nvarchar, 40
  todate, date, NULL
  password, char, 60
  firma_id, int,  NULL
  asukoht_id, int,  NULL */

  try {
    // ootame kuni on kryptitud ja lisame arraysse
    // updateList.password = await bcrypt.hash();
    user.password = await bcrypt.hash(user.password.trim(), saltRounds);
  } catch (error) {
    console.log('bcrypt error!');
    return next(error);
  }
  try {
    let pool = await sql.connect(sqlConfig);
    let data = await pool
      .request()
      .input('enimi', sql.NVarChar, user.enimi)
      .input('pnimi', sql.NVarChar, user.pnimi)
      .input('email', sql.NVarChar, user.email)
      .input('mob', sql.NVarChar, user.mob || null)
      .input('roll', sql.NVarChar, user.roll)
      .input('markus', sql.NVarChar, user.markus || null)
      .input('pilt', sql.NVarChar, user.pilt || null)
      .input('todate', sql.DateTime, user.todate || null)
      .input('password', sql.DateTime, user.password)
      .input('firma_id', sql.Int, user.firma_id || null)
      .input('asukoht_id', sql.Int, user.asukoht_id || null)

      .query(
        'INSERT INTO users(enimi, pnimi, email, mob, roll, markus, pilt, todate, password, firma_id, asukoht_id) VALUES (@enimi, @pnimi, @email, @mob, @roll, @markus, @pilt, @todate, @password, @firma_id, @asukoht_id)'
      );
    if (data.rowsAffected > 0) {
      res.json({
        status: true,
        message: 'Uus kasutaja on lisatud!',
      });
    } else {
      throw new Error('Kasutajat ei lisatud');
    }
  } catch (err) {
    next(err);
  }

  /* return knex('users')
    .insert(user)
    .then(() => {
      res.json({
        status: true,
        message: 'Uus kasutaja on lisatud!',
      });
    })
    .catch((err) => next(err)); */
};

/* -------------------------------------------------------------------------- */
/*                                 getKasutaja                                */
/* -------------------------------------------------------------------------- */
//get('/:id'
const getKasutaja = async (req, res, next) => {
  if (!req.params.id) {
    console.log('Kasutaja ID puududb!');
    return next(new Error('Kasutaja ID puududb!'));
  }
  try {
    const pool = await sql.connect(sqlConfig);
    const data = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query(
        'SELECT dbo.users.id, dbo.users.enimi, dbo.users.pnimi, dbo.users.email, dbo.users.mob, dbo.users.roll, dbo.users.markus, dbo.users.pilt, dbo.users.todate, dbo.users.firma_id, dbo.users.asukoht_id, dbo.asukoht.nimi AS asukoht, dbo.firmagrupp.nimi AS asutus FROM dbo.users INNER JOIN dbo.asukoht ON dbo.users.asukoht_id = dbo.asukoht.id INNER JOIN dbo.firmagrupp ON dbo.users.firma_id = dbo.firmagrupp.fgid WHERE dbo.users.id=@id'
      );
    if (data.recordset.length) {
      res.status(200).json(data.recordset);
    } else {
      res.status(500).json({
        status: false,
        message: 'Sellise ID-ga kasutajat ei leia!',
      });
    }
  } catch (err) {
    next(err);
  }
};

/* -------------------------------------------------------------------------- */
/*                            Muudame lisame pildi                            */
/* -------------------------------------------------------------------------- */

const lisaPilt = async (req, res, next) => {
  if (!req.params.id) {
    return next(new Error('Kasutaja ID puudub!'));
  }
  //tekitame andmebaasi ühenduse
  const pool = await sql.connect(sqlConfig);
  const request = pool.request();

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
  const otsiDbPildiName = async (id) => {
    try {
      request.input('id', sql.Int, id);
      const result = await request.query(
        'SELECT pilt FROM dbo.users WHERE id=@id'
      );
      if (result.length > 0) {
        return result.recordset[0].pilt;
      } else return null;
    } catch (err) {
      throw err;
    }
  };

  // Muudame andmebaasis faili nime
  const muudaDbFileName = async (id, pilt) => {
    try {
      request.input('pilt', sql.NVarChar, pilt);
      const result = await request.query(
        'UPDATE dbo.users SET pilt=@pilt WHERE id=@id'
      );
      if (!(result.rowsAffected > 0)) {
        throw new Error('Andmebaasi pilti ei muudetud!');
      }
    } catch (err) {
      throw err;
    }
    //await knex('users').where('id', id).update('pilt', pilt);
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
        mess = 'Pilt on kustutatud!';
      }
      return res.status(200).send(mess);
    } catch (err) {
      return next(err);
    }
  };
  return muudaPilt();
};

/* -------------------------------------------------------------------------- */
/*                               Kustatame pildi                              */
/* -------------------------------------------------------------------------- */

const delPilt = async (req, res, next) => {
  if (!req.query.pilt) {
    return next(new Error('Pilt puudub!'));
  }
  // const otsiPilt = req.query.pilt;
  const otsiPilt = '1';

  //Kustutame faili kataloogist
  const delFile = async () => {
    try {
      await fs.remove(`${pildiPath}${otsiPilt}`);
      return res.status(200).send({
        status: true,
        message: 'Pilt on kustutatud!',
      });
      // await delFile(`${pildiPath}${otsiPilt}`);
    } catch (error) {
      throw new Error(error);
    }
  };

  // kustutame andmebaasist pildi
  const delDbPilt = async () => {
    try {
      const pool = await sql.connect(sqlConfig);
      const request = pool.request();
      request.input('pilt', sql.NVarChar, otsiPilt);
      const result = await request.query(
        'UPDATE dbo.users SET pilt=null WHERE pilt=@pilt'
      );
      if (result.rowsAffected > 0) {
        // if (result.rowsAffected) {
        //Kui andmebaasit leidsime faili ja
        //kustutasime siis kustutame ka päris faili
        delFile();
      } else {
        throw new Error('DB-st pilti ei leitud!');
      }
    } catch (err) {
      next(err);
    }
  };
  return delDbPilt();
};

/* -------------------------------------------------------------------------- */
/*                              Muudame kasutajat                             */
/* -------------------------------------------------------------------------- */
//put('/:id')
const muudameKasutajat = async (req, res, next) => {
  if (!req.params.id) {
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
  knex('users')
    .where('id', req.params.id)
    .update(updateList)
    .then(() => {
      res.status(200).json({
        status: true,
        message: 'Kasutaja andmed on muudetud!',
      });
    })
    .catch((err) => next(err));
  return null;
};

/* -------------------------------------------------------------------------- */
/*                              Leiame asukohad                              */
/* -------------------------------------------------------------------------- */
const getAsukohad = async (req, res, next) => {
  try {
    const pool = await sql.connect(sqlConfig);
    const request = pool.request();
    const result = await request.query(
      'SELECT id, nimi FROM dbo.asukoht ORDER BY id'
    );
    res.status(200).json(result.recordset);
  } catch (err) {
    next(err);
  }
};

/* ------------------------------ Export module ----------------------------- */

module.exports = {
  uusKasutaja,
  getKasutaja,
  muudameKasutajat,
  lisaPilt,
  delPilt,
  getAsukohad,
};
