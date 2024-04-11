//const { json } = require('body-parser');
const knex = require('../config/mssql');
const sql = require('mssql');

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

/* -------------------------------------------------------------------------- */
/*                               Täna aktiivsed                               */
/* -------------------------------------------------------------------------- */
const tanaTool = (req, res, next) => {
  req.params.asukoht;
  knex
    .select('tulem')
    .from('wtanatool')
    .where('asukoht_id', req.params.asukoht)
    //.first()
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                             Tana aktiivsed list                            */
/* -------------------------------------------------------------------------- */
const tanaToolList = (req, res, next) => {
  knex('WTanaToolList')
    .where('asukoht_id', req.params.asukoht)
    .orderBy('JRK')
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                            Täna mitte aktiivsed                            */
/* -------------------------------------------------------------------------- */
const tanaPoleTool = (req, res, next) => {
  knex
    .select('tulem')
    .from('wtanapoletool')
    .where('asukoht_id', req.params.asukoht)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                            Täna mitte aktiivsed list                       */
/* -------------------------------------------------------------------------- */
const tanaPoleToolList = (req, res, next) => {
  knex('wtanapolelist')
    .where('asukoht_id', req.params.asukoht)
    .orderBy('Nimi')
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                            Täna aktiivsed grupid                           */
/* -------------------------------------------------------------------------- */

const tanaAktGrupp = (req, res, next) => {
  req.params.ggrupp;
  knex('wLyhikeTanaTool_kogus')
    .where((builder) => {
      builder.where('GGRUPP', req.params.ggrupp);
      if (req.query.asukoht) builder.andWhere('asukoht_id', req.query.asukoht);
    })
    .orderBy([
      { column: 'LEPNR' },
      { column: 'TOO' },
      { column: 'START', order: 'desc' },
    ])
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                                  Otsi tood                                 */
/* -------------------------------------------------------------------------- */
const otsiTood = (req, res, next) => {
  console.log(req.params);
  //knex("w_rk_otsi_tood")
  knex
    .select(
      'JOB.LEPNR',
      'JOB.JOB AS TOO',
      'JOB.JID',
      'JOB.KOGUS',
      'JOB.LKOOD',
      'GRUPP.GGRUPP',
      'GRUPP.GNIMI',
      knex.raw(
        'CASE WHEN (COUNT(dbo.RESULT.START) = COUNT(dbo.RESULT.STOP)) THEN 0 ELSE 1 END AS ontoos, ' +
          'CASE WHEN (SUM(RESULT.RESULT) > 0) THEN 1 ELSE 0 END AS onresult'
      )
    )
    .from('GRUPP')
    .innerJoin('JOB', 'GRUPP.GID', 'JOB.GID')
    .leftOuterJoin('RESULT', 'JOB.JID', '=', 'RESULT.JID')
    .whereLike('LEPNR', req.params.lepnr)
    .modify(function (queryBuilder) {
      if (req.params.elem == 'true') {
        queryBuilder.andWhere('GGRUPP', 'Elemendiliin');
      }
    })
    .andWhereLike('JOB.JOB', req.params.too)
    .groupBy(
      'JOB.LEPNR',
      'JOB.JOB',
      'JOB.JID',
      'JOB.KOGUS',
      'GRUPP.GGRUPP',
      'GRUPP.GNIMI',
      'JOB.LKOOD'
    )
    .orderBy([
      { column: 'too' },
      { column: 'gnimi' },
      { column: 'ontoos', order: 'desc' },
    ])
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                               Otsi ribakoodi                               */
/* -------------------------------------------------------------------------- */

const otsiRibaKoodi = (req, res, next) => {
  knex
    .select(
      'JOB.LEPNR',
      'JOB.JOB AS TOO',
      'JOB.JID',
      'JOB.KOGUS',
      'JOB.LKOOD',
      'GRUPP.GGRUPP',
      'GRUPP.GNIMI',
      knex.raw(
        'CASE WHEN (COUNT(dbo.RESULT.START) = COUNT(dbo.RESULT.STOP)) THEN 0 ELSE 1 END AS ontoos, ' +
          'CASE WHEN (SUM(RESULT.RESULT) > 0) THEN 1 ELSE 0 END AS onresult'
      )
    )
    .from('GRUPP')
    .innerJoin('JOB', 'GRUPP.GID', 'JOB.GID')
    .leftOuterJoin('RESULT', 'JOB.JID', '=', 'RESULT.JID')
    .where('JOB.LKOOD', req.params.ribakood)
    .groupBy(
      'JOB.LEPNR',
      'JOB.JOB',
      'JOB.JID',
      'JOB.KOGUS',
      'GRUPP.GGRUPP',
      'GRUPP.GNIMI',
      'JOB.LKOOD'
    )
    .orderBy([
      { column: 'too' },
      { column: 'gnimi' },
      { column: 'ontoos', order: 'desc' },
    ])
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => {
      console.error(err, 'SQL error');
      return next(new Error(err));
    });
};

/* -------------------------------------------------------------------------- */
/*                           Otsi ribakoodi uus sql                           */
/* -------------------------------------------------------------------------- */
const otsiRibaKoodiUus = async (req, res, next) => {
  try {
    let pool = await sql.connect(sqlConfig);
    let data = await pool
      .request()
      .input('ribakood', sql.Int, req.query.ribakood)
      .query(
        'SELECT dbo.JOB.LEPNR, dbo.JOB.JOB AS TOO, dbo.JOB.JID, dbo.JOB.KOGUS, dbo.GRUPP.GGRUPP, dbo.GRUPP.GNIMI, CASE WHEN (COUNT(dbo.RESULT.START) = COUNT(dbo.RESULT.STOP)) THEN 0 ELSE 1 END AS ontoos, CASE WHEN ( SUM(RESULT.RESULT) > 0) THEN 1 ELSE 0 END AS onresult, dbo.JOB.LKOOD FROM dbo.GRUPP INNER JOIN dbo.JOB ON dbo.GRUPP.GID = dbo.JOB.GID LEFT OUTER JOIN dbo.RESULT ON dbo.JOB.JID = dbo.RESULT.JID WHERE JOB.LKOOD = @ribakood GROUP BY dbo.JOB.LEPNR, dbo.JOB.JOB, dbo.JOB.JID, dbo.JOB.KOGUS, dbo.GRUPP.GGRUPP, dbo.GRUPP.GNIMI, dbo.JOB.LKOOD ORDER BY too, gnimi,ontoos desc'
      );
    res.json(data.recordset);
  } catch (err) {
    next(new Error(err));
  }
};

/* -------------------------------------------------------------------------- */
/*                                  Kes tegi                                  */
/* -------------------------------------------------------------------------- */

const kesTegi = (req, res, next) => {
  knex('w_rk_kes_tegi')
    .where('jid', req.params.jid)
    .orderBy([{ column: 'nimi' }, { column: 'start', order: 'desc' }])
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
};

const kesTegiUus = async (req, res, next) => {
  if (!req.params.jid) {
    console.error('Töö ID puudub!');
    return next(new Error('Töö ID puudub!'));
  }
  try {
    const pool = await sql.connect(sqlConfig);
    const data = await pool
      .request()
      .input('jid', sql.Int, req.params.jid)
      .query(
        "SELECT dbo.RESULT.JID, FORMAT(dbo.RESULT.START, 'dd.MM.yyyy') AS kpv, dbo.TOOTAJAD.PNIMI + ' ' + dbo.TOOTAJAD.ENIMI AS nimi, dbo.TOOTAJAD.PNIMI, dbo.TOOTAJAD.ENIMI, dbo.TOOTAJAD.pilt, dbo.TOOTAJAD.TID FROM dbo.RESULT INNER JOIN dbo.TOOTAJAD ON dbo.RESULT.TID = dbo.TOOTAJAD.TID where JID=@jid group by FORMAT(dbo.RESULT.START, 'dd.MM.yyyy'),nimi, JID, Pnimi, enimi, pilt, dbo.TOOTAJAD.TID order by kpv desc,pnimi"
      );
    res.json(data.recordset);
  } catch (err) {
    return next(new Error(err));
  }
};

/* -------------------------------------------------------------------------- */
/*                                Elemendi info                               */
/* -------------------------------------------------------------------------- */

const elemInfo = (req, res, next) => {
  knex('w_rk_elem_info')
    .where('jid', req.params.jid)
    .then((rows) => {
      res.status(200).json(rows).first;
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                            Elemendi statistikat                            */
/* -------------------------------------------------------------------------- */
const elemStats = (req, res, next) => {
  knex('w_rk_elem_stats')
    .where('jid', req.params.jid)
    .then((rows) => {
      res.status(200).json(rows).first;
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
module.exports = {
  tanaTool,
  tanaToolList,
  tanaPoleTool,
  tanaPoleToolList,
  tanaAktGrupp,
  otsiTood,
  otsiRibaKoodi,
  otsiRibaKoodiUus,
  kesTegi,
  kesTegiUus,
  elemInfo,
  elemStats,
};
