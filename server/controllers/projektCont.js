/**
 *Module dependencies
 */
const fs = require('fs-extra');

const knex = require('../config/knex');

/**
 *Module Variables
 */

const projektiPath = 'lepingdata/';
//
// ──────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: T E E M E   U U E   P R O J E K T I : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────────────
//
const newProjekt = async (req, res, next) => {
  if (!req.body.leping || !req.body.nimi || !req.body.juht) {
    return next(new Error('Pole piisavalt andmeid'));
  }
  const objekt = {};
  Object.keys(req.body).forEach((key) => {
    objekt[key] = req.body[key].trim();
  });

  // const uusProjekt = async () => {
  try {
    await knex('projekt').insert(objekt);
    await fs.ensureDir(`${projektiPath}${objekt.leping}`);
    return res.json({
      status: true,
      message: 'Uus projekt on loodud!',
    });
  } catch (error) {
    console.log(error, 'Uus projekt error');
    return next(error);
  }
};
// ────────────────────────────────────────────────────────────────────────────────

//
// ──────────────────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: K U S T U T A M E   P R O J E K T I   J A   K A U S T A D : :  :   :    :     :       :
// ─────────────────────────────────────────────────────────────────────────────────────────────────
//
const delProjekt = async (req, res, next) => {
  if (!req.params.id) {
    return next(new Error('Projekti ID puududb!'));
  }
  const lepinguNr = async () =>
    knex('projekt')
      .select('leping')
      .where('id', req.params.id)
      .then((rows) => {
        if (rows.length > 0) {
          return rows[0].leping;
        }
        return next(new Error('Sellise ID-ga lepingut ei leidnud'));
      });
  const delDbProjekt = async () => {
    await knex('projekt').where('id', req.params.id).del();
  };
  const kustutaLeping = async () => {
    try {
      const nr = await lepinguNr();
      if (nr) {
        await fs.remove(`${projektiPath}${nr}`);
        await delDbProjekt();
        res.json({
          status: true,
          message: 'Projekt on kustutatud!',
        });
      }
    } catch (error) {
      console.log(error, 'Projekti kustutamise error!');
      return next(error);
    }
  };
  return kustutaLeping();
};
// ────────────────────────────────────────────────────────────────────────────────

//
// ──────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: M U U D A M E   P R O J E K T I : :  :   :    :     :        :          :
// ──────────────────────────────────────────────────────────────────────────────────
//
const editProjekt = async (req, res, next) => {
  if (!req.params.id) {
    return next(new Error('Projekti ID on puudu!'));
  }
  const vanaLepNr = async (id) =>
    knex('projekt')
      .where('id', id)
      .then((row) => row[0].leping);
  const updateList = {};
  // Tekitame update listi
  Object.keys(req.body).forEach((key) => {
    updateList[key] = req.body[key].trim();
  });
  if (updateList.leping) {
    try {
      const vanaLep = await vanaLepNr(req.params.id);
      await fs.move(
        `${projektiPath}${vanaLep}`,
        `${projektiPath}${updateList.leping}`
      );
    } catch (error) {
      return next(error);
    }
  }
  return knex('projekt')
    .where('id', req.params.id)
    .update(updateList)
    .then(() => {
      res.status(200).json({
        status: true,
        message: 'Projekt on muudetud!',
      });
    })
    .catch((err) => next(err));
};
// ────────────────────────────────────────────────────────────────────────────────

//
// ────────────────────────────────────────────────────────────────────── I ──────────
//   :::::: P R O J E K T I D E   L I S T : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────────
//
const listProjekt = (req, res, next) => {
  knex('projekt')
    .select(
      'projekt.nimi',
      'projekt.leping',
      'projekt.riik',
      'projekt.desc',
      'users.enimi',
      'users.pnimi',
      'users.email',
      'users.mob',
      'users.pilt'
    )
    .innerJoin('users', 'projekt.juht', 'users.id')
    .orderBy('projekt.nimi')
    .then((rows) => {
      res.status(200).json({
        status: true,
        data: rows,
      });
    })
    .catch((err) => next(err));
};
// ────────────────────────────────────────────────────────────────────────────────
//
// ────────────────────────────────────────────────────────────────── I ──────────
//   :::::: O T S I   P R O J E K T I : :  :   :    :     :        :          :
// ────────────────────────────────────────────────────────────────────────────
//
/*
 *
 * Otsime projekti:
 * lepingu
 * nime
 * riigi
 * emaili järgi
 *
 */

const findProjekt = (req, res, next) => {
  if (!req.params.otsitext) {
    listProjekt(req, res, next);
  }
  const otsing = req.params.otsitext;
  knex('projekt')
    .select(
      'projekt.nimi',
      'projekt.leping',
      'projekt.riik',
      'projekt.desc',
      'users.enimi',
      'users.pnimi',
      'users.email',
      'users.mob',
      'users.pilt'
    )
    .innerJoin('users', 'projekt.juht', 'users.id')
    .where('projekt.leping', 'like', `%${otsing}%`)
    .orWhere('projekt.nimi', 'like', `%${otsing}%`)
    .orWhere('projekt.riik', 'like', `%${otsing}%`)
    .orWhere('users.email', 'like', `%${otsing}%`)
    .orderBy('projekt.leping')
    .then((rows) => {
      res.status(200).json({
        status: true,
        data: rows,
      });
    })
    .catch((err) => next(err));
};

/**
 *Export Module
 */
module.exports = {
  newProjekt,
  delProjekt,
  editProjekt,
  listProjekt,
  findProjekt,
};
