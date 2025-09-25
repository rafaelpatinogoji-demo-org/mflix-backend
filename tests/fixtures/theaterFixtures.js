const mongoose = require('mongoose');

const validTheater = {
  theaterId: 1,
  location: {
    address: {
      street1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipcode: '12345'
    },
    geo: {
      type: 'Point',
      coordinates: [-73.9857, 40.7484]
    }
  }
};

const validTheatersList = [
  {
    theaterId: 1,
    location: {
      address: {
        street1: '123 First St',
        city: 'First City',
        state: 'FC',
        zipcode: '12345'
      },
      geo: {
        type: 'Point',
        coordinates: [-73.9857, 40.7484]
      }
    }
  },
  {
    theaterId: 2,
    location: {
      address: {
        street1: '456 Second St',
        city: 'Second City',
        state: 'SC',
        zipcode: '23456'
      },
      geo: {
        type: 'Point',
        coordinates: [-74.0060, 40.7128]
      }
    }
  },
  {
    theaterId: 3,
    location: {
      address: {
        street1: '789 Third St',
        city: 'Third City',
        state: 'TC',
        zipcode: '34567'
      },
      geo: {
        type: 'Point',
        coordinates: [-118.2437, 34.0522]
      }
    }
  }
];

const invalidTheater = {
  location: {
    address: {
      street1: 'Invalid Theater',
      city: 'Invalid City',
      state: 'IC',
      zipcode: '99999'
    },
    geo: {
      type: 'Point',
      coordinates: [-73.9857, 40.7484]
    }
  }
};

module.exports = {
  validTheater,
  validTheatersList,
  invalidTheater
};
