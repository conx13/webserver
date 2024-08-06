const bcrypt = require('bcrypt');
const sqlConfig = require('../config/mssql');
const sql = require('mssql');
const path = require('path');
const fs = require('fs-extra');
const abiks = require('../utils/utils');
const multer = require('multer');

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
/*                 Function to validate and prepare updateList                */
/* -------------------------------------------------------------------------- */
//kasutame uue kasutaja muutmisel ja lisamisel
const prepareUpdateList = async (body) => {
  const updateList = {};

  // Iterate over the properties of the body object
  for (const key in body) {
    // Check if the property is not empty or null
    if (body[key] !== '' && body[key] !== null) {
      // Add the property to the updateList object
      updateList[key] = body[key];
    }
  }

  // Validate and prepare todate property
  if (updateList.todate) {
    try {
      updateList.todate = new Date(updateList.todate);
    } catch (error) {
      throw new Error('Invalid date format for todate');
    }
  }

  // Validate and prepare password property
  if (updateList.password) {
    try {
      updateList.password = await bcrypt.hash(
        updateList.password.trim(),
        saltRounds
      );
    } catch (error) {
      console.log('bcrypt error!');
      throw new Error('Error hashing password');
    }
  }
  return updateList;
};

/* -------------------------------------------------------------------------- */
/*               Function to get the SQL type based on the value              */
/* -------------------------------------------------------------------------- */
//kasutame sqlType leidmisel
const getSqlType = (value) => {
  if (typeof value === 'string') {
    return sql.NVarChar;
  } else if (typeof value === 'number') {
    return sql.Int;
  } else if (value instanceof Date) {
    return sql.DateTime;
  } else {
    throw new Error('Unsupported value type');
  }
};

/* -------------------------------------------------------------------------- */
/*                             Lisame uue kasutaja                            */
/* -------------------------------------------------------------------------- */

const uusKasutaja = async (req, res, next) => {
  if (
    !req.body.firma_id ||
    !req.body.email ||
    !req.body.password ||
    !req.body.enimi ||
    !req.body.pnimi
  ) {
    return next(new Error('Andmed on puudu!'));
  }

  try {
    //kasutame abivalemid üleval prepareUpdateList ja getSqlType
    const user = await prepareUpdateList(req.body);
    const inputs = [];
    Object.keys(user).forEach((key) => {
      inputs.push({
        name: key,
        type: getSqlType(user[key]),
        value: user[key],
      });
    });

    const query = `INSERT INTO users(${inputs
      .map((input) => input.name)
      .join(', ')}) VALUES (${inputs
      .map((input) => `@${input.name}`)
      .join(', ')})`;

    // Execute SQL query
    const pool = await sql.connect(sqlConfig);
    const request = pool.request();
    inputs.forEach((input) =>
      request.input(input.name, input.type, input.value)
    );
    const result = await request.query(query);
    if (result.rowsAffected > 0) {
      res.status(200).json({
        status: true,
        message: 'Uus kasutaja on listaud!',
      });
    } else {
      throw new Error('Uut kasutajat ei lisatud!');
    }
  } catch (error) {
    next(error);
  }
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

  try {
    //kasutame abivalemid üleval prepareUpdateList ja getSqlType
    const updateList = await prepareUpdateList(req.body);
    // Prepare SQL query inputs
    const inputs = [];
    Object.keys(updateList).forEach((key) => {
      inputs.push({
        name: key,
        type: getSqlType(updateList[key]),
        value: updateList[key],
      });
    });
    // Prepare SQL query
    const query = `UPDATE dbo.users SET ${inputs
      .map((input) => `${input.name} = @${input.name}`)
      .join(', ')} WHERE id = @id`;

    // Execute SQL query
    const pool = await sql.connect(sqlConfig);
    const request = pool.request();
    inputs.forEach((input) =>
      request.input(input.name, input.type, input.value)
    );
    request.input('id', sql.Int, req.params.id);
    const result = await request.query(query);
    console.log(result, 'Result:');
    if (result.rowsAffected > 0) {
      res.status(200).json({
        status: true,
        message: 'Kasutaja andmed on muudetud!',
      });
    } else {
      throw new Error('Kasutaja andmed ei muudetud!');
    }
  } catch (err) {
    next(err);
  }
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
