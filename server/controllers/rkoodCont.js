//const { json } = require('body-parser');
const knex = require('../config/mssql');

/* -------------------------------------------------------------------------- */
/*                               Täna aktiivsed                               */
/* -------------------------------------------------------------------------- */
const tanaTool = (req, res, next) => {
    knex('wtanatool')
        .first()
        .then((rows) => {
            res.status(200).json(rows
            );
        })
        .catch(err => next(err));
};

/* -------------------------------------------------------------------------- */
/*                             Tana aktiivsed list                            */
/* -------------------------------------------------------------------------- */
const tanaToolList = (req, res, next) => {
    knex('WTanaToolList').then((rows) => {
        res.status(200).json(rows);
    }).catch(err => next(err));
}

/* -------------------------------------------------------------------------- */
/*                            Täna mitte aktiivsed                            */
/* -------------------------------------------------------------------------- */
const tanaPoleTool = (req, res, next) => {
    knex('wtanapoletool')
    .first()
        .then((rows) => {
            res.status(200).json(rows);
        })
        .catch(err => next(err));
};

/* -------------------------------------------------------------------------- */
/*                            Täna mitte aktiivsed list                       */
/* -------------------------------------------------------------------------- */
const tanaPoleToolList = (req, res, next) => {
    knex('wtanapolelist').orderBy('Nimi')
        .then((rows) => {
            res.status(200).json(rows);
        })
        .catch(err => next(err));
};

/* -------------------------------------------------------------------------- */
/*                            Täna aktiivsed grupid                           */
/* -------------------------------------------------------------------------- */

const tanaAktGrupp = (req, res, next) => {
    req.params.ggrupp;
    knex('wLyhikeTanaTool_kogus').where('GGRUPP', req.params.ggrupp).orderBy('TOO','START', 'PNIMI')
        .then((rows) => {
            res.status(200).json(rows);
        })
        .catch(err => next(err));
}


/* -------------------------------------------------------------------------- */
/*                                 Töötaja TID                                */
/* -------------------------------------------------------------------------- */

const tootaja = (req, res, next) => {
    req.params.tid;
    knex('w_rk_tootajad')
        .where('TID', req.params.tid)
        .then((rows) => {
        res.status(200).json(rows);
    }).catch(err => next(err));
}

/* -------------------------------------------------------------------------- */
/*                               Töötaja frupid                               */
/* -------------------------------------------------------------------------- */

const tootajagrupp = (req, res, next) => {
    knex.select('toogrupp_id', 'toogrupp_nimi')
        .from('toogrupp')
        .then((rows) => {
            res.status(200).json(rows);
        }).catch(err => next(err));
}


/* -------------------------------------------------------------------------- */
module.exports = {
    tanaTool,
    tanaToolList,
    tanaPoleTool,
    tanaPoleToolList,
    tanaAktGrupp,
    tootaja,
    tootajagrupp
};