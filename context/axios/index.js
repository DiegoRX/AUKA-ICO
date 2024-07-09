/* eslint-disable class-methods-use-this */
import axios from 'axios';

class RequestService {
  constructor() {
    /* */
    this.version = 'tokens';
    this.urlServer = 'https://usdt-ico-d1866abb8067.herokuapp.com/txs';
  }

  async post(data) {
    try {
      const resp = await axios.post(`${this.urlServer}`, data, {});
      return this.switchCase(resp);
    } catch (error) {
      return this.switchCase(error.request);
    }
  }

  async get() {
    try {
      const resp = await axios.get(`${this.urlServer}${this.version}`, {});
      return this.switchCase(resp);
    } catch (error) {
      return this.switchCase(error.request);
    }
  }

  async getOne(id) {
    try {
      const resp = await axios.get(`${this.urlServer}${this.version}/${id}`, {});
      return this.switchCase(resp);
    } catch (error) {
      return this.switchCase(error.request);
    }
  }

  async put(url, data) {
    try {
      const resp = await axios.put(`${this.urlServer}${this.version}/${url}`, data, {});
      return this.switchCase(resp);
    } catch (error) {
      return this.switchCase(error.request);
    }
  }
  async updatePriceHistory(address, data) {
    try {
      const resp = await axios.put(`${this.urlServer}${this.version}/${address}/price`, data, {});
      return this.switchCase(resp);
    } catch (error) {
      return this.switchCase(error.request);
    }
  }
  async updatePriceHistory(address, data) {
    try {
      const resp = await axios.put(`${this.urlServer}${this.version}/${address}/price`, data, {
    
      });
      return this.switchCase(resp);
    } catch (error) {
      return this.switchCase(error.request);
    }
  }
  async delete(url) {
    try {
      const resp = await axios.delete(`${this.urlServer}${this.version}${url}`, {});
      return this.switchCase(resp);
    } catch (error) {
      return this.switchCase(error.request);
    }
  }

  // eslint-disable-next-line consistent-return
  switchCase(resp) {
    const { status } = resp;
    const respuesta = {
      data: resp.data,
      status: 0,
      mensaje: '',
    };
    switch (status) {
      case 200:
        respuesta.status = 200;
        return respuesta;
      case 201:
        respuesta.status = 201;
        respuesta.mensaje = 'Registro exitoso';
        return respuesta;
      case 202:
        respuesta.status = 202;
        respuesta.mensaje = 'Acepted';
        return respuesta;
      case 400:
        respuesta.status = 400;
        respuesta.mensaje = JSON.parse(resp.responseText).message || 'Registro duplicado';
        return respuesta;
      case 401:
        respuesta.status = 401;
        respuesta.mensaje = 'Acceso no autorizado';
        return respuesta;
      case 404:
        respuesta.status = 404;
        respuesta.mensaje = 'Ruta no encontrada';
        return respuesta;
      case 500:
        respuesta.status = 500;
        respuesta.mensaje = 'Error en el servidor';
        return respuesta;
      default:
        break;
    }
  }
}
export default new RequestService();
