/* eslint-disable no-console */
/**
*Module dependencies
*/
const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const knex = require('./mssql');

// salvestame user.id sessionisse ja kasutame hiljem
passport.serializeUser((user, done) => done(null, user));

// võtame sessionist user.id ja otsime sellele värsked andmed külge
passport.deserializeUser((user, done) => {
  knex('users')
    .select('id', 'firma', 'email', 'roll', 'todate', 'pilt')
    .where('id', user.id)
    .then((row) => {
      done(null, row[0]);
    })
    .catch(err => done(new Error(err)));
});

// kontrollime kas selline kasutaja ja email on olemas
passport.use(new LocalStrategy(
  { usernameField: 'email', session: false },
  (email, password, done) => {
    knex('users')
      .select('id', 'firma', 'email', 'roll', 'todate', 'password', 'pilt')
      .where('email', email)
      .then((rows) => {
        const user = rows[0];
        // Kui ei leia selle emailiga kasutajat
        if (!user) {
          return done(null, false, { message: 'Vale email!\n' });
          // return null
        }
        // Kui kasutaja ei ole enam aktiivne
        if (user.todate) {
          const aktkpv = new Date(user.todate);
          aktkpv.setHours(23); // Lisame tunnid et kell ei oleks väiksem hetkest
          const tanakpv = Date.now();
          if (aktkpv < tanakpv) { // Kui kpv on väiksem hetkest
            return done(null, false, { message: 'Konto ei ole aktiivne!\n Võta ühendust projektijuhiga!\n' });
          }
        }
        // Kui on vale parool
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false, { message: 'Vale parool!\n' });
          // return null
        }
        delete user.password;
        return done(null, user);
        // return null
      })
      .catch((err) => {
        console.error(err);
        return done(err);
        // return null
      });
  },
));
/**
*Export Module
*/
module.exports = passport;
