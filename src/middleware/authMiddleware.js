const jwt = require('jsonwebtoken');
const Session = require('../models/Session');

const c_JWT_SECRET = process.env.JWT_SECRET || 'mflix_jwt_secret_key';

// Middleware para verificar el token JWT y validar la sesión
const f_authenticateToken = async (p_req, p_res, p_next) => {
  try {
    const v_authHeader = p_req.headers['authorization'];
    const v_token = v_authHeader && v_authHeader.split(' ')[1];

    if (!v_token) {
      return p_res.status(401).json({ 
        message: 'Access token is required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verificar el token JWT
    let v_decoded;
    try {
      v_decoded = jwt.verify(v_token, c_JWT_SECRET);
    } catch (p_jwtError) {
      if (p_jwtError.name === 'TokenExpiredError') {
        return p_res.status(401).json({ 
          message: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      return p_res.status(401).json({ 
        message: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }

    // Validar que la sesión existe en MongoDB y está activa
    const v_session = await Session.findOne({ 
      jwt: v_token, 
      status: 'active' 
    });

    if (!v_session) {
      return p_res.status(401).json({ 
        message: 'Session not found or inactive',
        code: 'SESSION_INVALID'
      });
    }

    // Verificar que la sesión no ha expirado
    const v_currentTime = new Date();
    if (new Date(v_session.expiry) < v_currentTime) {
      // Marcar la sesión como inactiva
      await Session.findByIdAndUpdate(v_session._id, { status: 'inactive' });
      return p_res.status(401).json({ 
        message: 'Session has expired',
        code: 'SESSION_EXPIRED'
      });
    }

    // Adjuntar información del usuario al objeto request
    p_req.user = {
      id: v_decoded.userId,
      email: v_decoded.email
    };
    p_req.session = v_session;

    p_next();
  } catch (p_error) {
    console.error('Authentication error:', p_error);
    p_res.status(500).json({ 
      message: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = {
  f_authenticateToken
};
