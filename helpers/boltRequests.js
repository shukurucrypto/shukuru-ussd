const axios = require('axios')
const { BOLT_APIURL } = require('../constants')

const boltBarePOSTRequest = async (data, url) => {
  try {
    const result = await axios.post(`${BOLT_APIURL}${url}`, data)

    if (!result.data.success)
      return { success: false, error: result.data.error }

    return result.data
  } catch (error) {
    return error
  }
}

const boltPOSTRequest = async (data, token, url) => {
  try {
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${BOLT_APIURL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data: data,
    }

    const result = await axios.request(config)

    if (!result.data.success) return { success: false, error: result.data }

    return result.data
  } catch (error) {
    return error
  }
}

const boltGETRequest = async (data, token, url) => {
  try {
    let config

    if (data) {
      config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${BOLT_APIURL}${url}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        data: data && data,
      }
    } else {
      config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${BOLT_APIURL}${url}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    }

    const result = await axios.request(config)

    if (!result.data.success) return { success: false, error: result.data }

    return result.data
  } catch (error) {
    return {
      success: false,
      error: error,
    }
  }
}

const boltPayInvoice = async (invoice, token) => {
  const data = {
    payment_hash: invoice,
  }

  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: BOLT_APIURL + '/invoice/pay',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: data,
  }

  axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data))
    })
    .catch((error) => {
      console.log(error)
    })
}

module.exports = {
  boltPOSTRequest,
  boltGETRequest,
  boltBarePOSTRequest,
  boltPayInvoice,
}
