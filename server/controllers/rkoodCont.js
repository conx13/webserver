//const { json } = require('body-parser');
const knex = require("../config/mssql");

/* -------------------------------------------------------------------------- */
/*                               Täna aktiivsed                               */
/* -------------------------------------------------------------------------- */
const tanaTool = (req, res, next) => {
  knex("wtanatool")
    .first()
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                             Tana aktiivsed list                            */
/* -------------------------------------------------------------------------- */
const tanaToolList = (req, res, next) => {
  knex("WTanaToolList")
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                            Täna mitte aktiivsed                            */
/* -------------------------------------------------------------------------- */
const tanaPoleTool = (req, res, next) => {
  knex("wtanapoletool")
    .first()
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                            Täna mitte aktiivsed list                       */
/* -------------------------------------------------------------------------- */
const tanaPoleToolList = (req, res, next) => {
  knex("wtanapolelist")
    .orderBy("Nimi")
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
  knex("wLyhikeTanaTool_kogus")
    .where("GGRUPP", req.params.ggrupp)
    .orderBy([{ column: "TOO" }, { column: "START" }, { column: "ENIMI" }])
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                                 Töötaja TID                                */
/* -------------------------------------------------------------------------- */

const tootaja = (req, res, next) => {
  req.params.tid;
  knex("w_rk_tootajad")
    .where("TID", req.params.tid)
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                               Töötaja frupid                               */
/* -------------------------------------------------------------------------- */

const tootajagrupp = (req, res, next) => {
  knex
    .select("toogrupp_id", "toogrupp_nimi")
    .from("toogrupp")
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
  knex("w_rk_otsi_tood")
    .whereLike("LEPNR", req.params.lepnr)
    .modify(function (queryBuilder) {
      if (req.params.elem == "true") {
        queryBuilder.andWhere("GGRUPP", "Elemendiliin");
      }
    })
    .andWhereLike("TOO", req.params.too)
    .orderBy([
      { column: "too" },
      { column: "gnimi" },
      { column: "ontoos", order: "desc" },
    ])
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
};

/* -------------------------------------------------------------------------- */
/*                                  Kes tegi                                  */
/* -------------------------------------------------------------------------- */

const kesTegi = (req, res, next) => {
  knex("w_rk_kes_tegi")
    .where("jid", req.params.jid)
    .orderBy([{ column: "nimi" }, { column: "start" }])
    .then((rows) => {
      res.status(200).json(rows);
    })
    .catch((err) => next(err));
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
}

/* -------------------------------------------------------------------------- */
module.exports = {
  tanaTool,
  tanaToolList,
  tanaPoleTool,
  tanaPoleToolList,
  tanaAktGrupp,
  tootaja,
  tootajagrupp,
  otsiTood,
  kesTegi,
  elemInfo
};
