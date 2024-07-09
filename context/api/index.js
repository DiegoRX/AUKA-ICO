/* eslint-disable no-dupe-keys */
const API = "http://localhost:5000";

const endPoints = {
  users: {
    getUsers: `${API}/users`,
    postUsers: `${API}/users/register`,
    getUserByWalletAddress: `${API}/users/address/`,
    postLogin: `${API}/users/login`,
    putUsers: `${API}/users`, //editar info de usuarios
  },
  auth: {
    login: `${API}/users/login`,
    profile: `${API}/users/profile`,
  },
  files: {
    postFiles: `${API}/files/upload`,
    getFiles: (fileName) => `${API}/${fileName}`,
  },
  drivers: {
    getDrivers: `${API}/drivers`,
    addReaction: `${API}/reactions`,
  },
  transfers: {
    getTransfers: `${API}/transfers`,
    addTransfer: `${API}/transfers`,
  },
  complains:{
    getComplains:`${API}/complains`,
    addComplain:`${API}/complains`,
    updateComplain:(complainId) => `${API}/complains/${complainId}`,
  }
};

export default endPoints;
