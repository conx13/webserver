/* eslint-disable no-console */
/**
 *Module dependencies
 */
const bcrypt = require('bcrypt');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const sql = require('mssql');

const abiks = require('../utils/utils');
const knex = require('../config/knex');

const sqlConfig = require('../config/mssql');

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

/**
 *Module Variables
 */
const saltRounds = 10;
const { resizePilt } = abiks;
let pool;

// Ühenduspooli loomine
async function connectToPool() {
  try {
    if (!pool) {
      pool = await sql.connect(sqlConfig);

      console.log('ei ole rquesti');
    } else {
      console.log('on rquest');
    }
  } catch (error) {
    throw new Error(error);
  }
}

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
/*                Function teha kindlaks õige kuupäeva formaat                */
/* -------------------------------------------------------------------------- */
function isValidDate(dateString) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/;
  return dateRegex.test(dateString);
}

/* -------------------------------------------------------------------------- */
/*                              Loome uue töötaja                             */
/* -------------------------------------------------------------------------- */
//POST /api/users
/**
 * @api {post} /api/users Lisa uus töötaja
 *
 * @apiParam {String} enimi Töötaja eesnimi.
 * @apiParam {String} pnimi Töötaja perekonnanimi.
 * @apiParam {String} ikood Töötaja isikukood.
 * @apiParam {Number} ajagupp Töötaja ajagrupi ID.
 * @apiParam {Boolean} aktiivne Kas töötaja on aktiivne.
 * @apiParam {Number} toogrupp_id Töötaja töögrupi ID.
 * @apiParam {Number} firma_id Töötaja firma ID.
 * @apiParam {Number} asukoht_id Töötaja asukoha ID.
 *
 * @apiSuccess {Boolean} response.status True if the operation was successful.
 * @apiSuccess {String} response.message Message indicating the result of the operation.
 *
 */
const newuser = async (req, res, next) => {
  if (
    !req.body.enimi ||
    !req.body.pnimi ||
    !req.body.ikood ||
    !req.body.ajagupp ||
    !req.body.aktiivne ||
    !req.body.toogrupp_id ||
    !req.body.firma_id ||
    !req.body.asukoht_id
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

    const query = `INSERT INTO tootajad(${inputs
      .map((input) => input.name)
      .join(', ')}) VALUES (${inputs
      .map((input) => `@${input.name}`)
      .join(', ')})`;

    // Execute SQL query
    await connectToPool();
    const request = pool.request();
    inputs.forEach((input) =>
      request.input(input.name, input.type, input.value)
    );
    const result = await request.query(query);
    if (result.rowsAffected > 0) {
      res.status(200).json({
        status: true,
        message: 'Uus töötaja on lisatud!',
      });
    } else {
      throw new Error('Uut töötajat ei lisatud!');
    }
  } catch (error) {
    next(error);
  }
};
/* -------------------------------------------------------------------------- */
/*                              Muudame töötajat                              */
/* -------------------------------------------------------------------------- */
//put('api/users/:id')
const edituser = async (req, res, next) => {
  if (!req.params.tid) {
    return next(new Error('Tid on puudu'));
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
    const query = `UPDATE dbo.tootajad SET ${inputs
      .map((input) => `${input.name} = @${input.name}`)
      .join(', ')} WHERE tid = @tid`;

    // Execute SQL query
    await connectToPool();
    const request = pool.request();
    inputs.forEach((input) =>
      request.input(input.name, input.type, input.value)
    );
    request.input('tid', sql.Int, req.params.tid);
    await connectToPool();
    const result = await request.query(query);

    if (result.rowsAffected > 0) {
      res.status(200).json({
        status: true,
        message: 'Töötaja andmed on muudetud!',
      });
    } else {
      throw new Error('Töötaja andmed ei muudetud!');
    }
  } catch (err) {
    next(err);
  }
};
/* -------------------------------------------------------------------------- */
/*                              Näitame töötajat                              */
/* -------------------------------------------------------------------------- */
/**
 * @api {get} /api/users/:tid Töötaja andmed
 *
 * @apiParam {Number} tid Töötaja ID.
 *
 * @apiSuccess {Object} recordset Object containing information about the employee.
 * @apiSuccess {String} recordset.ENIMI Employee's first name.
 * @apiSuccess {String} recordset.PNIMI Employee's last name.
 * @apiSuccess {Number} recordset.TID Employee's ID.
 * @apiSuccess {String} recordset.IKOOD Employee's personal code.
 * @apiSuccess {Number} recordset.AJAGUPP Employee's work time group ID.
 * @apiSuccess {Boolean} recordset.Aktiivne Employee's active status.
 * @apiSuccess {Number} recordset.toogrupp_id Employee's work group ID.
 * @apiSuccess {String} recordset.telefon Employee's phone number.
 * @apiSuccess {String} recordset.toogrupp_nimi Name of the employee's work group.
 * @apiSuccess {String} recordset.Ajanimi Name of the employee's work time group.
 * @apiSuccess {String} recordset.pilt Employee's picture file name.
 * @apiSuccess {String} recordset.email Employee's email address.
 * @apiSuccess {String} recordset.firma Name of the employee's company.
 * @apiSuccess {Number} recordset.firma_id ID of the employee's company.
 * @apiSuccess {String} recordset.asukoht Name of the employee's location.
 * @apiSuccess {Number} recordset.asukoht_id ID of the employee's location.
 *
 */
const tootaja = async (req, res, next) => {
  if (!req.params.tid) {
    return next(new Error('Kasutaja ID puududb!'));
  }
  try {
    await connectToPool();
    const request = pool.request();
    request.input('tid', sql.NVarChar, req.params.tid);
    const query =
      'SELECT dbo.TOOTAJAD.ENIMI, dbo.TOOTAJAD.PNIMI, dbo.TOOTAJAD.TID, dbo.TOOTAJAD.IKOOD, dbo.TOOTAJAD.AJAGUPP, dbo.TOOTAJAD.Aktiivne, dbo.TOOTAJAD.toogrupp_id, dbo.TOOTAJAD.telefon, dbo.toogrupp.toogrupp_nimi, dbo.AJAD.Nimi AS Ajanimi, dbo.TOOTAJAD.pilt, dbo.TOOTAJAD.email, dbo.firmagrupp.nimi AS firma, dbo.firmagrupp.fgid AS firma_id, dbo.asukoht.nimi AS asukoht, dbo.asukoht.id AS asukoht_id FROM dbo.TOOTAJAD INNER JOIN dbo.toogrupp ON dbo.TOOTAJAD.toogrupp_id = dbo.toogrupp.toogrupp_id INNER JOIN dbo.AJAD ON dbo.TOOTAJAD.AJAGUPP = dbo.AJAD.AID INNER JOIN dbo.firmagrupp ON dbo.TOOTAJAD.firma_id = dbo.firmagrupp.fgid INNER JOIN dbo.asukoht ON dbo.TOOTAJAD.asukoht_id = dbo.asukoht.id WHERE TID = @tid';
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    return next(new Error(err));
  }
};
/* -------------------------------------------------------------------------- */
/*                        Kõik tööaja grupidde list                           */
/* -------------------------------------------------------------------------- */

const tootajaAjaGrupp = async (req, res, next) => {
  /**
   * @api {get} /api/users/ajagrupp Kõik tööaja grupidde list
   *
   * @apiSuccess {Object[]} recordset Array of objects containing information about work time groups.
   * @apiSuccess {Number} recordset.id ID of the work time group.
   * @apiSuccess {String} recordset.nimi Name of the work time group.
   * @apiSuccess {String} recordset.markus Description of the work time group, including lunch break times.
   */
  try {
    await connectToPool();
    const request = pool.request();
    const query =
      "SELECT AID AS id, nimi, 'Lõuna ' + Llopp + '-' + Lalgus AS markus FROM AJAD";
    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/*                             Töötaja aja grupid                             */
/* -------------------------------------------------------------------------- */
/**
 * @api {get} /api/users/toogrupp Kõik töötajate töögruppide list
 *
 * @apiSuccess {Object[]} recordset Array of objects containing information about work groups.
 * @apiSuccess {Number} recordset.id ID of the work group.
 * @apiSuccess {String} recordset.nimi Name of the work group.
 */
const tootajaTooGrupp = async (req, res, next) => {
  try {
    await connectToPool();
    const request = pool.request();
    const query =
      'SELECT toogrupp_id as id, toogrupp_nimi as nimi FROM toogrupp ORDER BY toogrupp_nimi';
    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (error) {
    next(error);
  }
};
/* -------------------------------------------------------------------------- */
/*                               Töötaja asukoht                              */
/* -------------------------------------------------------------------------- */
const tootajaAsukoht = async (req, res, next) => {
  /**
   * @api {get} /api/users/asukoht Kõik töötajate asukohtade list
   *
   * @apiSuccess {Number} recordset.id ID of the location.
   * @apiSuccess {String} recordset.nimi Name of the location.
   */
  try {
    await connectToPool();
    const request = pool.request();
    const query = 'SELECT id, nimi FROM dbo.asukoht ORDER BY nimi';
    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (err) {
    next(err);
  }
};

/* -------------------------------------------------------------------------- */
/*                                Töötaja firma                               */
/* -------------------------------------------------------------------------- */
const tootajaFirmad = async (req, res, next) => {
  /**
   * @api {get} /api/users/firmad Kõik töötajate firmade list
   *
   * @apiSuccess {Number} recordset.id ID of the company.
   * @apiSuccess {String} recordset.nimi Name of the company.
   */
  try {
    await connectToPool();
    const request = pool.request();
    const query = 'SELECT fgid as id, nimi FROM dbo.firmagrupp ORDER BY nimi';
    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (err) {
    next(err);
  }
};
/* -------------------------------------------------------------------------- */
/*                         Otsime viimati aktiivse aja                        */
/* -------------------------------------------------------------------------- */
const viimatiAktiivne = async (req, res, next) => {
  /**
   * @api {get} /api/users/viimatiakt/:tid Viimati aktiivse töö info
   *
   * @apiParam {Number} tid Töötaja ID.
   *
   * @apiSuccess {String} recordset.start Start time of the last active work.
   * @apiSuccess {Number} recordset.rid ID of the last active work.
   * @apiSuccess {Number} recordset.jid ID of the job of the last active work.
   */
  try {
    const request = pool.request();
    request.input('tid', sql.Int, req.params.tid);
    const query =
      'SELECT TOP 1 start, rid, jid FROM RESULT WHERE tid=@tid ORDER BY start DESC';
    await connectToPool();
    const result = await request.query(query);
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/*                           Töötaja ajagrupid kõik                           */
/* -------------------------------------------------------------------------- */
const tooAjaGrupp = async (req, res, next) => {
  /**
   * @api {get} /api/users/tootaja/ajagrupp/:tid Töötaja ajagrupi info
   *
   * @apiParam {Number} tid Töötaja ID.
   *
   * @apiSuccess {String} recordset.Tooalgus Start time of the work day.
   * @apiSuccess {String} recordset.Toolopp End time of the work day.
   * @apiSuccess {String} recordset.Lalgus Start time of the lunch break.
   * @apiSuccess {String} recordset.Llopp End time of the lunch break.
   */
  try {
    request.input('tid', sql.Int, req.params.tid);
    const query =
      'SELECT TOP 1 Tooalgus, Toolopp, Lalgus, Llopp FROM AJAD INNER JOIN tootajad ON ajad.aid = tootajad.ajagupp WHERE tootajad.tid=@tid';
    await connectToPool();
    const request = pool.request();
    const result = await request.query(query);
    res.status(200).json(result.recordset[0]);
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/*                      Lõpetame töötaja olemasoleva töö                      */
/* -------------------------------------------------------------------------- */
/**
 * @api {put} /api/users/too/:rid Lõpeta töötaja töö
 *
 * @apiParam {Number} rid Töö ID.
 *
 * @apiParam {String} stop Lõpp aeg formaadis YYYY-MM-DD HH:MM.
 * @apiParam {Number} result Töö tulemus (0 - ei tehtud, 1 - tehtud).
 *
 * @apiSuccess {Boolean} response.status True if the operation was successful.
 * @apiSuccess {String} response.message Message indicating the result of the operation.
 *
 */
const tooLopp = async (req, res, next) => {
  if (!req.body.stop || !req.body.result || !req.params.rid) {
    return next(new Error('Andmed on puudu!'));
  }
  // Validate date format
  if (!isValidDate(req.body.stop)) {
    console.log(req.body.stop, 'STOP');
    return next(new Error('Stop peab olema YYYY-MM-DD HH:MM'));
  }
  try {
    // Execute SQL query

    await connectToPool();
    const request = pool.request();
    request.input('stop', req.body.stop);
    request.input('result', sql.Int, req.body.result);
    request.input('rid', sql.Int, req.params.rid);
    request.input('kasutaja', sql.NVarChar, req.user.pnimi);
    const query =
      'UPDATE result SET stop=@stop, result=@result, kasutaja=@kasutaja WHERE rid=@rid';
    const result = await request.query(query);
    if (result.rowsAffected[0] > 0) {
      res.status(200).json({
        status: true,
        message: 'Töötaja töö on lõpetatud!',
      });
    } else {
      console.log(result.rowsAffected, 'Muudetud read');
      throw new Error('Kasutaja andmed ei muudetud!');
    }
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/*                          Lisame töötajale uue töö                          */
/* -------------------------------------------------------------------------- */
/**
 * @api {post} /api/users/too/:tid Lisa töötajale uus töö
 *
 * @apiParam {Number} params.tid Töötaja ID.
 * @apiParam {Number} body.jid Töö ID.
 * @apiParam {String} body.start Töö algusaeg formaadis YYYY-MM-DD HH:MM.

 * @apiSuccess {Boolean} response.status True if the operation was successful.
 * @apiSuccess {String} response.message Message indicating the result of the operation.
 *
 */
const uusToo = async (req, res, next) => {
  if (!req.body.start || !req.body.jid || !req.params.tid) {
    return next(new Error('Andmed on puudu!'));
  }
  if (!isValidDate(req.body.start)) {
    console.log(req.body.start, 'START');
    return next(new Error('Start peab olema YYYY-MM-DD HH:MM'));
  }

  try {
    // Execute SQL query
    await connectToPool();
    const request = pool.request();
    request.input('tid', sql.Int, req.params.tid);
    request.input('jid', sql.Int, req.body.jid);
    request.input('start', sql.NVarChar, req.body.start);
    request.input('kasutaja', sql.NVarChar, req.user.pnimi);
    const query =
      'INSERT INTO result (tid, jid, start, kasutaja) VALUES (@tid, @jid, @start, @kasutaja)';
    const result = await request.query(query);
    if (result.rowsAffected[0] > 0) {
      res.status(200).json({
        status: true,
        message: 'Uus töö on lisatud!',
      });
    } else {
      throw new Error('Uut tööd ei lisatud!');
    }
  } catch (error) {
    next(error);
  }
};

//
// ──────────────────────────────────────────────────────────────────── I ──────────
//   :::::: K O I K   K A S U T A J A D : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────
/**
 * @api {get} /api/users Kõik kasutajad
 *
 * @apiSuccess {Number} recordset.id ID of the user.
 * @apiSuccess {String} recordset.enimi User's first name.
 * @apiSuccess {String} recordset.pnimi User's last name.
 * @apiSuccess {String} recordset.email User's email address.
 * @apiSuccess {Number} recordset.firma_id ID of the user's company.
 * @apiSuccess {Number} recordset.asukoht_id ID of the user's location.
 * @apiSuccess {String} recordset.mob User's mobile phone number.
 * @apiSuccess {String} recordset.roll User's role.
 * @apiSuccess {String} recordset.markus User's description.
 * @apiSuccess {Date} recordset.todate User's date of employment.
 * @apiSuccess {String} recordset.pilt User's picture file name.
 *
 */
const allUsers = async (req, res, next) => {
  try {
    await connectToPool();
    const request = pool.request();
    const query =
      'SELECT id, enimi, pnimi, email, firma_id, asukoht_id, mob, roll, markus, todate, pilt FROM dbo.users';
    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (err) {
    next(err);
  }
};

// ──────────────────────────────────────────────────── I ──────────
//   :::::: O T S I M E : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────
/**
 * @api {get} /api/users/otsi/:otsi/:akt Otsi töötajaid
 *
 * @apiParam {String} otsi Otsitav tekst.
 * @apiParam {String} akt Aktiivsuse filter (%).
 * @apiParam {Number} asukoht Asukoha filter.
 *
 * @apiSuccess {Number} recordset.TID Employee's ID.
 * @apiSuccess {String} recordset.ENIMI Employee's first name.
 * @apiSuccess {String} recordset.PNIMI Employee's last name.
 * @apiSuccess {String} recordset.IKOOD Employee's personal code.
 * @apiSuccess {Number} recordset.AJAGUPP Employee's work time group ID.
 * @apiSuccess {Boolean} recordset.Aktiivne Employee's active status.
 * @apiSuccess {Number} recordset.toogrupp_id Employee's work group ID.
 * @apiSuccess {String} recordset.telefon Employee's phone number.
 * @apiSuccess {String} recordset.toogrupp_nimi Name of the employee's work group.
 * @apiSuccess {String} recordset.Ajanimi Name of the employee's work time group.
 * @apiSuccess {String} recordset.pilt Employee's picture file name.
 * @apiSuccess {String} recordset.email Employee's email address.
 * @apiSuccess {String} recordset.firma Name of the employee's company.
 * @apiSuccess {Number} recordset.firma_id ID of the employee's company.
 * @apiSuccess {String} recordset.asukoht Name of the employee's location.
 * @apiSuccess {Number} recordset.asukoht_id ID of the employee's location.
 *
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
    const pool = await sql.connect(sqlConfig);
    const request = pool.request();
    request.input('akt', sql.NVarChar, akt);
    request.input('asukoht', sql.Int, req.params.asukoht);
    request.input('otsiText', sql.NVarChar, `%${req.params.otsi}%`);
    const query =
      'SELECT dbo.TOOTAJAD.ENIMI, dbo.TOOTAJAD.PNIMI, dbo.TOOTAJAD.TID, dbo.TOOTAJAD.IKOOD, dbo.TOOTAJAD.AJAGUPP, dbo.TOOTAJAD.Aktiivne, dbo.TOOTAJAD.toogrupp_id, dbo.TOOTAJAD.telefon, dbo.toogrupp.toogrupp_nimi, dbo.AJAD.Nimi AS Ajanimi, dbo.TOOTAJAD.pilt, dbo.TOOTAJAD.email, dbo.firmagrupp.nimi AS firma, dbo.firmagrupp.fgid AS firma_id, dbo.asukoht.nimi AS asukoht, dbo.asukoht.id AS asukoht_id FROM dbo.TOOTAJAD INNER JOIN dbo.toogrupp ON dbo.TOOTAJAD.toogrupp_id = dbo.toogrupp.toogrupp_id INNER JOIN dbo.AJAD ON dbo.TOOTAJAD.AJAGUPP = dbo.AJAD.AID INNER JOIN dbo.firmagrupp ON dbo.TOOTAJAD.firma_id = dbo.firmagrupp.fgid INNER JOIN dbo.asukoht ON dbo.TOOTAJAD.asukoht_id = dbo.asukoht.id WHERE aktiivne = @akt and asukoht_id = @asukoht and (enimi like @otsiText or pnimi like @otsiText)';
    const result = await request.query(query);
    res.status(200).json(result.recordset);
  } catch (err) {
    next(err);
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
/* -------------------------------------------------------------------------- */
/*                            Lisame muudame pilti                            */
/* -------------------------------------------------------------------------- */
const lisaPilt = async (req, res, next) => {
  if (!req.params.id) {
    return next(new Error('Kasutaja ID puudub!'));
  }
  try {
    // 2) Otsime ID järgi pildi DB-st
    const vanaPilt = await otsiDbPildiName(req.params.id);

    // 3) Kustutame vana pildi, kui see on olemas
    if (vanaPilt) {
      await fs.remove(`${pildiPath}${vanaPilt}`);
    }

    // 4) Kui uus pilt on üles laetud, siis muudame selle suurust ja salvestame
    if (req.file) {
      const pathTemp = `${pildiPath}${'Temp.jpeg'}`;
      //muudame pildi suurust
      await resizePilt(`${pildiPath}${req.file.filename}`, pathTemp);
      //muudame/lisame faili nime andmebaasis
      await muudaDbFileName(req.params.id, req.file.filename);
      //kustutame suure faili ära jne
      await fs.copy(pathTemp, `${pildiPath}${req.file.filename}`);
      return res.status(200).send(req.file.filename);
    } else {
      // 5) Kui faili ei ole, siis kustutame DB-s nime
      await muudaDbFileName(req.params.id, null);
      return res.status(200).send('Pilt on kustutatud!');
    }
  } catch (error) {
    return next(error);
  }
};

// Helper functions
const otsiDbPildiName = async (id) => {
  try {
    await connectToPool();
    const request = pool.request();
    request.input('id', sql.Int, id);
    const result = await request.query(
      'SELECT pilt FROM dbo.tootajad WHERE tid=@id'
    );
    if (result.recordset.length > 0) {
      return result.recordset[0].pilt;
    } else return null;
  } catch (err) {
    throw err;
  }
};

const muudaDbFileName = async (id, pilt) => {
  try {
    await connectToPool();
    const request = pool.request();
    request.input('pilt', sql.NVarChar, pilt);
    request.input('id', sql.Int, id);
    const result = await request.query(
      'UPDATE dbo.tootajad SET pilt=@pilt WHERE tid=@id'
    );
    if (!(result.rowsAffected > 0)) {
      throw new Error('Andmebaasi pilti ei muudetud!');
    }
  } catch (err) {
    throw err;
  }
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
