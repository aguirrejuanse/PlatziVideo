const passport = require('passport');
const { BasicStrategy } = require('passport-http');
const boom = require('@hapi/boom');
const axios = require('axios');
// const { config } = require('../../../config/index');

require('dotenv').config;

// definimos nuestra nueva estrategia
passport.use(
  new BasicStrategy(async function (email, password, cb) {
    try {

      const { data, status } = await axios({
        url: `${process.env.API_URL}/api/auth/sign-in`,
        method: "post",
        auth: {
          password,
          username: email
        },
        data: {
          apiKeyToken: process.env.API_KEY_TOKEN
        }
      });
      
      if (!data || status !== 200) {
        return cb(boom.unauthorized("Fallo aquí chavos", false));
      }

      // la es respuesta es el token y la info del usuario
      return cb(null, data);

    } catch (error) {
      cb(error);
    }
  })
);