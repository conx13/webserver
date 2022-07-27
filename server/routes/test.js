/**
*Create router instance
*/
const express = require('express');

const router = express.Router();

const knex = require('../config/mssql');


const sql = require('mssql');
const { json } = require('body-parser');

/**
*Module dependencies
*/
router.get('/test', (req, res, next) => {
    res.status(200).send('TEST')});
/**
*Export Module
*/
router.get('/sql', (req, res, next) => {
 return knex('User')
 .then((row)=> res.json(row));
});

module.exports = router;
