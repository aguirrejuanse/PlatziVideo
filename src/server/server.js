import express from 'express';
require('dotenv').config();
import webpack from 'webpack';
import React from 'react';
import helmet from 'helmet';
import { renderToString } from 'react-dom/server';
import { Provider } from 'react-redux';
import { createStore, compose } from 'redux';
import { renderRoutes } from 'react-router-config';
import { StaticRouter } from 'react-router-dom';
import serverRoutes from '../frontend/routes/serverRoutes';
import initialState from '../frontend/initialState';
import reducer from '../frontend/reducers';
import getManifest from './getManifest';
import cookieParser from 'cookie-parser';
import boom from '@hapi/boom';
import passport from 'passport';
import axios from 'axios';

const { ENV, PORT } = process.env;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());

require('./utils/auth/strategies/basic.js')

if (ENV === 'development') {
  console.log('Development config');
  const webpackConfig = require('../../webpack.config');
  const webpackDevMiddleware = require('webpack-dev-middleware')
  const webpackHotMiddleware = require('webpack-hot-middleware');
  const compiler = webpack(webpackConfig);
  const serverConfig = { port: PORT, hot: true };

  app.use(webpackDevMiddleware(compiler, serverConfig));
  app.use(webpackHotMiddleware(compiler));
} else {
  app.use((req, res, next) => {
    if(!req.hashManifest) req.hashManifest = getManifest();
    next();
  })
  app.use(express.static(`${__dirname}/public`));
  app.use(helmet());
  app.use(helmet.permittedCrossDomainPolicies());
  app.disable('x-powered-by');
}

const setResponse = (html, preloadedState, manifest) => {
  // const mainStyles = manifest ? manifest['main.css'] : 'assets/app.css';
  const mainStyles = manifest ? manifest['vendors.css'] : 'assets/app.css'
  const mainBuild = manifest ? manifest['main.js'] : 'assets/app.js';
  const vendorBuild = manifest ? manifest['vendors.js'] : 'assets/vendor.js';

  return (
    `
    <!DOCTYPE html>
      <html>
        <head>
          <link rel="stylesheet" href="${mainStyles}" type="text/css">
          <title>Platzi Video</title>
        </head>
        <body>
          <div id="app">${html}</div>
          <script>
            window.__PRELOADED_STATE__ = ${JSON.stringify(preloadedState).replace(/</g, '\\u003c')}
          </script>
          <script src="${mainBuild}" type="text/javascript"></script>
          <script src="${vendorBuild}" type="text/javascript"></script>
        </body>
      </html>
  `
  );
}

const renderApp = (req, res) => {
  const store = createStore(reducer, initialState);
  const preloadedState = store.getState();
  const html = renderToString(
    <Provider store={store} >
      <StaticRouter location={req.url} context={{}} >
        {renderRoutes(serverRoutes)}
      </StaticRouter>
    </Provider>
  );

  res.send(setResponse(html, preloadedState, req.hashManifest));
}

app.get('*', renderApp);

app.post("/auth/sign-in", async function(req, res, next) {
  // Obtenemos el atributo rememberMe desde el cuerpo del request
  const { rememberMe } = req.body;
  // console.log(req.cookies);
  passport.authenticate("basic", function(error, data) {
    try {
      if (error || !data) {
        return next(boom.unauthorized("Error la data viene vacía :("));
      }

      req.login(data, { session: false }, async function(error) {
        if (error) {
          next(error);
        }

        const { token, ...user } = data;

        // Si el atributo rememberMe es verdadero la expiración será en 30 dias
        // de lo contrario la expiración será en 2 horas
        // res.cookie("token", token, {
        //   httpOnly: !config.dev,
        //   secure: !config.dev,
        //   maxAge: rememberMe ? THIRTY_DAYS_IN_SEC : TWO_HOURS_IN_SEC
        // });

        if (!config.dev) {
          res.cookie("token", token, {
            httpOnly: true,
            secure: true,
          });
        } else {
            res.cookie("token", token);
        }

        res.status(200).json(user);
      });
    } catch (error) {
      next(error);
    }
  })(req, res, next);
});

app.post("/auth/sign-up", async function(req, res, next) {
  const { body: user } = req;

  try {
    await axios({
      url: `${config.apiUrl}/api/auth/sign-up`,
      method: "post",
      data: user
    });

    res.status(201).json({ message: "user created" });
  } catch (error) {
    next(error);
  }
});

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log(`Server running on port ${PORT}`);
});