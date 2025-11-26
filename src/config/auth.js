const c_JWT_SECRET = process.env.JWT_SECRET;
const c_JWT_ALGORITHM = 'HS256';
const c_JWT_EXPIRY_MINUTES = 15;
const c_JWT_ISSUER = 'mflix-api';
const c_JWT_AUDIENCE = 'mflix-client';

const f_validateJwtConfig = () => {
  if (!c_JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required. Please set it before starting the application.');
  }
  
  if (c_JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security.');
  }
};

module.exports = {
  c_JWT_SECRET,
  c_JWT_ALGORITHM,
  c_JWT_EXPIRY_MINUTES,
  c_JWT_ISSUER,
  c_JWT_AUDIENCE,
  f_validateJwtConfig
};
