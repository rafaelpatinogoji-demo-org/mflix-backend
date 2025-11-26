const jwt = require('jsonwebtoken');
const Session = require('../models/Session');
const { 
  c_JWT_SECRET, 
  c_JWT_ALGORITHM,
  c_JWT_ISSUER,
  c_JWT_AUDIENCE
} = require('../config/auth');

const f_authenticateToken = async (p_req, p_res, p_next) => {
  try {
    const v_authHeader = p_req.headers['authorization'];
    
    if (!v_authHeader || !v_authHeader.startsWith('Bearer ')) {
      return p_res.status(401).json({ 
        message: 'Bearer token is required',
        code: 'TOKEN_MISSING'
      });
    }
    
    const v_token = v_authHeader.substring(7);

    if (!v_token || typeof v_token !== 'string') {
      return p_res.status(401).json({ 
        message: 'Invalid token format',
        code: 'INVALID_TOKEN_FORMAT'
      });
    }

    let v_decoded;
    try {
      v_decoded = jwt.verify(v_token, c_JWT_SECRET, {
        algorithms: [c_JWT_ALGORITHM],
        issuer: c_JWT_ISSUER,
        audience: c_JWT_AUDIENCE
      });
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
    console.error('Authentication error:', p_error.message);
    p_res.status(500).json({ 
      message: 'Internal server error during authentication',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = {
  f_authenticateToken
};
