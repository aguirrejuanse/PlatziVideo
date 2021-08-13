import axios from 'axios';

export const setFavorite = (payload) => ({
  type: 'SET_FAVORITE',
  payload,
});

export const deleteFavorite = (payload) => ({
  type: 'DELETE_FAVORITE',
  payload,
});

export const loginRequest = (payload) => ({
  type: 'LOGIN_REQUEST',
  payload,
});

export const logoutRequest = (payload) => ({
  type: 'LOGOUT_REQUEST',
  payload,
});

export const registerRequest = (payload) => {
  console.log('registerRequest', payload);
  return {
    type: 'REGISTER_REQUEST',
    payload,
  };
};

export const getVideoSource = (payload) => ({
  type: 'GET_VIDEO_SOURCE',
  payload,
});

export const setError = (payload) => ({
  type: 'SET_ERROR',
  payload,
});

// export const registerUser = (payload, redirectUrl) => {
//   return (dispatch) => {
//     console.log('action register user');
//     console.log(payload, redirectUrl);
//     axios.post('/auth/sign-up', payload)
//       .then(({ data }) => dispatch(registerRequest(data)))
//       .then(() => {
//         console.log(data);
//         console.log('redirijo a login');
//         window.location.href = redirectUrl;
//       })
//       .catch((error) => dispatch(setError(error)));
//   };
// };

export const registerUser = (payload, redirectUrl) => async (dispatch) => {
  try {
    const { data } = await axios.post('/auth/sign-up', payload);
    dispatch(registerRequest(data));
    window.location.href = redirectUrl;
  } catch (error) {
    console.log(error);
  }
};

// export const loginUser = ({ email, password }, redirectUrl) => {
//   return (dispatch) => {
//     console.log('action');
//     axios({
//       url: '/auth/sign-in',
//       method: 'post',
//       auth: {
//         username: email,
//         password,
//       },
//     })
//       .then(({ data }) => {
//         document.cookie = `email=${data.user.email}`;
//         document.cookie = `name=${data.user.name}`;
//         document.cookie = `id=${data.user.id}`;
//         document.cookie = `token=${data.user.token}`;
//         dispatch(loginRequest(data.user));
//         console.log('redirijo');
//       })
//       .then(() => {
//         window.location.href = redirectUrl;
//       })
//       .catch((err) => dispatch(setError(err)));
//   };
// };

export const loginUser = ({ email, password }, redirectUrl) => {
  return (dispatch) => {
    axios({
      url: '/auth/sign-in',
      method: 'post',
      auth: {
        username: email,
        password,
      },
    })
      .then(({ data }) => {
        document.cookie = `email=${data.user.email}`;
        document.cookie = `name=${data.user.name}`;
        document.cookie = `id=${data.user.id}`;
        dispatch(loginRequest(data.user));
      })
      .then(() => {
        window.location.href = redirectUrl;
      })
      .catch((err) => dispatch(setError(err)));
  };
};
