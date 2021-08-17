import express from 'express';
import webpack from 'webpack';
import React from 'react';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import boom from '@hapi/boom';
import passport from 'passport';
import axios from 'axios';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { renderRoutes } from 'react-router-config';
import { StaticRouter } from 'react-router-dom';
import serverRoutes from '../frontend/routes/serverRoutes';
import reducer from '../frontend/reducers';
import getManifest from './getManifest';
import webpackConfig from '../../webpack.config';

require('dotenv').config();

const { ENV, PORT } = process.env;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

//basic
require('./utils/auth/strategies/basic');

// Agregamos las variables de timpo en segundos
const THIRTY_DAYS_IN_SEC = 2592000;
const TWO_HOURS_IN_SEC = 7200;

if (ENV === 'development') {
  console.log('Development config');

  const compiler = webpack(webpackConfig);
  const serverConfig = { port: PORT, hot: true };

  app.use(webpackDevMiddleware(compiler, serverConfig));
  app.use(webpackHotMiddleware(compiler));
} else {
  app.use((req, res, next) => {
    if (!req.hashManifest) req.hashManifest = getManifest();
    next();
  });
  app.use(express.static(`${__dirname}/public`));
  app.use(helmet());
  app.use(helmet.permittedCrossDomainPolicies());
  app.disable('x-powered-by');
}

const setResponse = (html, preloadedState, manifest) => {
  // const mainStyles = manifest ? manifest['main.css'] : 'assets/app.css';
  const mainStyles = manifest ? manifest['vendors.css'] : 'assets/app.css';
  const mainBuild = manifest ? manifest['main.js'] : 'assets/app.js';
  const vendorBuild = manifest ? manifest['vendors.js'] : 'assets/vendor.js';

  return (
    `
    <!DOCTYPE html>
      <html>
        <head>
          <link rel='stylesheet' href='${mainStyles}' type='text/css'>
          <title>Platzi Video</title>
        </head>
        <body>
          <div id='app'>${html}</div>
          <script>
            window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, '\\u003c')}
          </script>
          <script src='${mainBuild}' type='text/javascript'></script>
          <script src='${vendorBuild}' type='text/javascript'></script>
        </body>
      </html>
  `
  );
};

const renderApp = async (req, res) => {
  let initialState;
  const { token, email, name, id } = req.cookies;

  try {
    let movieList = await axios({
      url: `${process.env.API_URL}/api/movies`,
      headers: { Authorization: `Bearer ${token}` },
      method: 'get',
    });
    movieList = movieList.data.data;
    initialState = {
      user: {
        id, email, name,
      },
      myList: [],
      trends: movieList.filter((movie) => movie.contentRating === 'PG' && movie._id),
      originals: movieList.filter((movie) => movie.contentRating === 'G' && movie._id),
    };
  } catch (err) {
    initialState = {
      user: {},
      myList: [],
      trends: [],
      originals: [],
    };
  }

  const store = createStore(reducer, initialState);
  const preloadedState = store.getState();
  const isLogged = (initialState.user.id);
  const html = renderToString(
    <Provider store={store}>
      <StaticRouter location={req.url} context={{}}>
        {renderRoutes(serverRoutes(isLogged))}
      </StaticRouter>
    </Provider>,
  );

  res.send(setResponse(html, preloadedState, req.hashManifest));
};

app.get('*', renderApp);

app.post('/auth/sign-in', async (req, res, next) => {
  // Obtenemos el atributo rememberMe desde el cuerpo del request
  const { rememberMe } = req.body;
  // console.log(req.cookies);
  passport.authenticate('basic', (error, data) => {
    try {
      console.log('data server.js', data);
      if (error || !data) {
        return next(boom.unauthorized('Error la data viene vacía :('));
      }

      req.login(data, { session: false }, async (err) => {
        if (err) {
          next(err);
        }

        const { token, ...user } = data;

        // Si el atributo rememberMe es verdadero la expiración será en 30 dias
        // de lo contrario la expiración será en 2 horas
        res.cookie('token', token, {
          httpOnly: !(ENV === 'development'),
          secure: !(ENV === 'development'),
          maxAge: rememberMe ? THIRTY_DAYS_IN_SEC : TWO_HOURS_IN_SEC,
        });

        // if (!ENV === 'development') {
        //   res.cookie('token', token, {
        //     httpOnly: true,
        //     secure: true,
        //   });
        // } else {
        //   res.cookie('token', token);
        // }

        return res.status(200).json(user);
      });
    } catch (error) {
      return next(error);
    }
  })(req, res, next);
});

app.post('/auth/sign-up', async (req, res, next) => {
  const { body: user } = req;

  try {
    console.log(`${process.env.API_URL}/api/auth/sign-up`);
    console.log(user);
    const userData = await axios({
      url: `${process.env.API_URL}/api/auth/sign-up`,
      method: 'post',
      data: {
        'email': user.email,
        'name': user.name,
        'password': user.password,
      },
    });
    console.log(userData.data);
    res.status(201).json({
      name: req.body.name,
      email: req.body.email,
      id: userData.data.id,
    });
    console.log('termino sign-up');
  } catch (error) {
    next(error);
  }
});

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log(`Server running on port ${PORT}`);
});
