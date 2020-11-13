require('dotenv/config');
const express = require('express');

const db = require('./database');
const ClientError = require('./client-error');
const staticMiddleware = require('./static-middleware');
const sessionMiddleware = require('./session-middleware');

const app = express();

app.use(staticMiddleware);
app.use(sessionMiddleware);

app.use(express.json());

// ----------routes

app.get('/api/sets', (req, res, next) => {
  const sql = `
    select "setId", "setName", "artistName", "image"
    from "sets"
    join "artists" using ("artistId")
  `;

  db.query(sql)
    .then(result => {
      res.status(200).json(result.rows);
    })
    .catch(err => console.error(err));
});

app.get('/api/artists', (req, res, next) => {
  const sql = `
    select *
    from "artists"
  `;

  db.query(sql)
    .then(result => {
      res.status(200).json(result.rows);
    })
    .catch(err => console.error(err));
});

app.get('/api/sets/:setName', (req, res, next) => {
  const setName = req.params.setName;
  const setNameLowercase = setName.toLowerCase();

  const sql = `
    select "setId", "setName", "artistName", "image"
    from "sets"
    join "artists" using ("artistId")
    where "setName" = $1
  `;

  const values = [setNameLowercase];

  db.query(sql, values)
    .then(result => {
      if (result.rows[0]) {
        res.status(200).json(result.rows);
      } else {
        next(new ClientError(`cannot find setName ${setName}`, 404));
      }
    })
    .catch(err => next(err));

});

app.get('/api/artists/:artistName', (req, res, next) => {
  const artistName = req.params.artistName;
  const artistNameLowercase = artistName.toLowerCase();

  const sql = `
    select "artistId", "artistName", "image", "setId", "setName"
    from "artists"
    join "sets" using ("artistId")
    where "artistName" = $1
  `;

  const values = [artistNameLowercase];

  db.query(sql, values)
    .then(result => {
      if (result.rows[0]) {
        res.status(200).json(result.rows);
      } else {
        next(
          new ClientError(`cannot find artistName ${artistNameLowercase}`, 404)
        );
      }
    })
    .catch(err => next(err));
});

app.get('/api/accounts/:account', (req, res, next) => {
  const account = req.params.account;
  const accountLowercase = account.toLowerCase();

  const sql = `
    select "artistId", "artistName", "image", "setId", "setName"
    from "artists"
    join "sets" using ("artistId")
    where "artistName" = $1
  `;

  const values = [accountLowercase];

  db.query(sql, values)
    .then(result => {
      if (result.rows[0]) {
        res.status(200).json(result.rows);
      } else {
        next(
          new ClientError(`cannot find artistName ${accountLowercase}`, 404)
        );
      }
    })
    .catch(err => next(err));
});

app.get('/api/artists/:artistName', (req, res, next) => {
  const artistName = req.params.artistName;
  const artistNameLowercase = artistName.toLowerCase();

  const sql = `
    select "artistId", "artistName", "image"
    from "artists"
    where "artistName" = $1
  `;

  const values = [artistNameLowercase];

  db.query(sql, values)
    .then(result => {
      if (result) {
        res.status(200).json(result.rows);
      } else {
        next(new ClientError(`cannot find artistName ${artistNameLowercase}`, 404));
      }
    })
    .catch(err => next(err));
});

// ----------

app.get('/api/health-check', (req, res, next) => {
  db.query('select \'successfully connected\' as "message"')
    .then(result => res.json(result.rows[0]))
    .catch(err => next(err));
});

app.use('/api', (req, res, next) => {
  next(new ClientError(`cannot ${req.method} ${req.originalUrl}`, 404));
});

app.use((err, req, res, next) => {
  if (err instanceof ClientError) {
    res.status(err.status).json({ error: err.message });
  } else {
    console.error(err);
    res.status(500).json({
      error: 'an unexpected error occurred'
    });
  }
});

app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log('Listening on port', process.env.PORT);
});
