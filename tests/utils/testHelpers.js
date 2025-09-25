const request = require('supertest');
const app = require('../../app');
const mongoose = require('mongoose');

const testRequest = request(app);

const generateObjectId = () => new mongoose.Types.ObjectId().toString();

const createTestData = async (Model, data) => {
  const instance = new Model(data);
  await instance.save();
  return instance;
};

const createMultipleTestData = async (Model, dataArray) => {
  const instances = await Model.insertMany(dataArray);
  return instances;
};

module.exports = {
  testRequest,
  generateObjectId,
  createTestData,
  createMultipleTestData
};
