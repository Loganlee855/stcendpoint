const crypto = require('crypto');
const axios = require("axios");
const ApiCredential = require('../models/ApiCredential');

async function generateSign(data) {
    const raw = `${data}`;
    return crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
}


async function createMemberGs(username) {
    const api = await ApiCredential.findOne();
    const Sign = await generateSign(api.apikey + username + api.secretkey);
    const params = {
      operatorcode: api.apikey,
      username: username,
      signature: Sign,
    };
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(`${api.url}createMember.aspx?${query}`);
    return response.data;
}

async function getBalanceGs(username,providercode) {
    const api = await ApiCredential.findOne();
    const Sign = await generateSign(`${api.apikey}${api.apikey}${providercode}${username}${api.secretkey}`);
    const params = {
      operatorcode: api.apikey,
      providercode: providercode,
      username: username,
      password: api.apikey,
      signature: Sign,
    };
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(`${api.url}getBalance.aspx?${query}`);
    return response.data;
}

async function depositGs(username,providercode,amount) {
    const referenceid = crypto.randomBytes(8).toString("hex");
    const api = await ApiCredential.findOne();
    const type = 0;
    const Sign = await generateSign(`${Number(amount)}${api.apikey}${api.apikey}${providercode}${referenceid}${type}${username}${api.secretkey}`);
    const params = {
      operatorcode: api.apikey,
      providercode: providercode,
      username: username,
      password: api.apikey,
      referenceid: referenceid,
      type: type,
      amount: Number(amount),
      signature: Sign,
    };
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(`${api.url}makeTransfer.aspx?${query}`);
    console.log("Deposit Response:", response.data);
    return response.data;
}

async function withdrawGs(username,providercode,amount) {
    const referenceid = crypto.randomBytes(8).toString("hex");
    const api = await ApiCredential.findOne();
    const type = 1;
    const Sign = await generateSign(`${Number(amount)}${api.apikey}${api.apikey}${providercode}${referenceid}${type}${username}${api.secretkey}`);
    const params = {
      operatorcode: api.apikey,
      providercode: providercode,
      username: username,
      password: api.apikey,
      referenceid: referenceid,
      type: type,
      amount: Number(amount),
      signature: Sign,
    };
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(`${api.url}makeTransfer.aspx?${query}`);
    return response.data;
}

async function launchGamesGs(username,providercode,type,gameid,lang) {
    const api = await ApiCredential.findOne();
    const Sign = await generateSign(`${api.apikey}${api.apikey}${providercode}${type}${username}${api.secretkey}`);
    const params = {
      operatorcode: api.apikey,
      providercode: providercode,
      username: username,
      password: api.apikey,
      type: type,
      gameid: gameid,
      lang: lang,
      html5: 1,
      platform: "web",
      signature: Sign,
    };
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(`${api.url}launchGames.aspx?${query}`);
    return response.data;
}

function filterTeXtusER(teks) {
  if (teks.length < 3) return teks;
  return teks.substring(0, 2) + teks.slice(-1);
}

module.exports = { createMemberGs, getBalanceGs, depositGs, withdrawGs, launchGamesGs, filterTeXtusER };
