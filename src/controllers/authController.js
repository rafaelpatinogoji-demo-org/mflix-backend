const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Session = require('../models/Session');
const { 
  c_JWT_SECRET, 
  c_JWT_ALGORITHM, 
  c_JWT_EXPIRY_MINUTES,
  c_JWT_ISSUER,
  c_JWT_AUDIENCE
} = require('../config/auth');

const f_login = async (p_req, p_res) => {
  try {
    const { email, password } = p_req.body;

    if (!email || !password) {
      return p_res.status(400).json({ 
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return p_res.status(400).json({ 
        message: 'Invalid input format',
        code: 'INVALID_INPUT_FORMAT'
      });
    }

    const v_sanitizedEmail = email.toLowerCase().trim();

    const v_user = await User.findOne({ email: v_sanitizedEmail });
    if (!v_user) {
      return p_res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const v_isPasswordValid = await bcrypt.compare(password, v_user.password);
    if (!v_isPasswordValid) {
      return p_res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const v_tokenPayload = {
      userId: v_user._id.toString(),
      email: v_user.email
    };

    const v_token = jwt.sign(v_tokenPayload, c_JWT_SECRET, { 
      algorithm: c_JWT_ALGORITHM,
      expiresIn: `${c_JWT_EXPIRY_MINUTES}m`,
      issuer: c_JWT_ISSUER,
      audience: c_JWT_AUDIENCE
    });

    const v_expiryDate = new Date();
    v_expiryDate.setMinutes(v_expiryDate.getMinutes() + c_JWT_EXPIRY_MINUTES);

    // Guardar sesión en MongoDB
    const v_session = new Session({
      user_id: v_user._id.toString(),
      jwt: v_token,
      expiry: v_expiryDate,
      status: 'active'
    });
    await v_session.save();

    p_res.status(200).json({
      message: 'Login successful',
      token: v_token,
      expiresAt: v_expiryDate,
      user: {
        id: v_user._id,
        name: v_user.name,
        email: v_user.email
      }
    });
  } catch (p_error) {
    console.error('Login error:', p_error.message);
    p_res.status(500).json({ 
      message: 'Internal server error during login',
      code: 'LOGIN_ERROR'
    });
  }
};

const f_logout = async (p_req, p_res) => {
  try {
    const v_authHeader = p_req.headers['authorization'];
    
    if (!v_authHeader || !v_authHeader.startsWith('Bearer ')) {
      return p_res.status(400).json({ 
        message: 'Bearer token is required',
        code: 'TOKEN_MISSING'
      });
    }
    
    const v_token = v_authHeader.substring(7);

    if (!v_token || typeof v_token !== 'string') {
      return p_res.status(400).json({ 
        message: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    // Buscar y desactivar la sesión
    const v_session = await Session.findOneAndUpdate(
      { jwt: v_token, status: 'active' },
      { status: 'inactive' },
      { new: true }
    );

    if (!v_session) {
      return p_res.status(404).json({ 
        message: 'Session not found or already inactive',
        code: 'SESSION_NOT_FOUND'
      });
    }

    p_res.status(200).json({
      message: 'Logout successful'
    });
  } catch (p_error) {
    console.error('Logout error:', p_error.message);
    p_res.status(500).json({ 
      message: 'Internal server error during logout',
      code: 'LOGOUT_ERROR'
    });
  }
};

const f_refreshToken = async (p_req, p_res) => {
  try {
    const v_authHeader = p_req.headers['authorization'];
    
    if (!v_authHeader || !v_authHeader.startsWith('Bearer ')) {
      return p_res.status(400).json({ 
        message: 'Bearer token is required',
        code: 'TOKEN_MISSING'
      });
    }
    
    const v_oldToken = v_authHeader.substring(7);

    if (!v_oldToken || typeof v_oldToken !== 'string') {
      return p_res.status(400).json({ 
        message: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    let v_decoded;
    try {
      v_decoded = jwt.verify(v_oldToken, c_JWT_SECRET, {
        algorithms: [c_JWT_ALGORITHM],
        issuer: c_JWT_ISSUER,
        audience: c_JWT_AUDIENCE
      });
    } catch (p_jwtError) {
      return p_res.status(401).json({ 
        message: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }

    // Verificar que la sesión existe y está activa
    const v_oldSession = await Session.findOne({ 
      jwt: v_oldToken, 
      status: 'active' 
    });

    if (!v_oldSession) {
      return p_res.status(401).json({ 
        message: 'Session not found or inactive',
        code: 'SESSION_INVALID'
      });
    }

    // Desactivar la sesión anterior
    await Session.findByIdAndUpdate(v_oldSession._id, { status: 'inactive' });

    const v_tokenPayload = {
      userId: v_decoded.userId,
      email: v_decoded.email
    };

    const v_newToken = jwt.sign(v_tokenPayload, c_JWT_SECRET, { 
      algorithm: c_JWT_ALGORITHM,
      expiresIn: `${c_JWT_EXPIRY_MINUTES}m`,
      issuer: c_JWT_ISSUER,
      audience: c_JWT_AUDIENCE
    });

    const v_expiryDate = new Date();
    v_expiryDate.setMinutes(v_expiryDate.getMinutes() + c_JWT_EXPIRY_MINUTES);

    // Crear nueva sesión
    const v_newSession = new Session({
      user_id: v_decoded.userId,
      jwt: v_newToken,
      expiry: v_expiryDate,
      status: 'active'
    });
    await v_newSession.save();

    p_res.status(200).json({
      message: 'Token refreshed successfully',
      token: v_newToken,
      expiresAt: v_expiryDate
    });
  } catch (p_error) {
    console.error('Token refresh error:', p_error.message);
    p_res.status(500).json({ 
      message: 'Internal server error during token refresh',
      code: 'REFRESH_ERROR'
    });
  }
};

const f_hashPassword = async (p_plainPassword) => {
  const c_SALT_ROUNDS = 12;
  return await bcrypt.hash(p_plainPassword, c_SALT_ROUNDS);
};

module.exports = {
  f_login,
  f_logout,
  f_refreshToken,
  f_hashPassword
};
