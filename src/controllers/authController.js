const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');

const c_JWT_SECRET = process.env.JWT_SECRET || 'mflix_jwt_secret_key';
const c_JWT_EXPIRY_HOURS = 24;

// Inicia sesión y genera un token JWT
const f_login = async (p_req, p_res) => {
  try {
    const { email, password } = p_req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return p_res.status(400).json({ 
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Buscar usuario por email
    const v_user = await User.findOne({ email });
    if (!v_user) {
      return p_res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verificar contraseña (comparación simple - en producción usar bcrypt)
    if (v_user.password !== password) {
      return p_res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generar token JWT
    const v_tokenPayload = {
      userId: v_user._id.toString(),
      email: v_user.email
    };

    const v_token = jwt.sign(v_tokenPayload, c_JWT_SECRET, { 
      expiresIn: `${c_JWT_EXPIRY_HOURS}h` 
    });

    // Calcular fecha de expiración
    const v_expiryDate = new Date();
    v_expiryDate.setHours(v_expiryDate.getHours() + c_JWT_EXPIRY_HOURS);

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
    console.error('Login error:', p_error);
    p_res.status(500).json({ 
      message: 'Internal server error during login',
      code: 'LOGIN_ERROR'
    });
  }
};

// Cierra la sesión actual (invalida el token)
const f_logout = async (p_req, p_res) => {
  try {
    const v_authHeader = p_req.headers['authorization'];
    const v_token = v_authHeader && v_authHeader.split(' ')[1];

    if (!v_token) {
      return p_res.status(400).json({ 
        message: 'Token is required',
        code: 'TOKEN_MISSING'
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
    console.error('Logout error:', p_error);
    p_res.status(500).json({ 
      message: 'Internal server error during logout',
      code: 'LOGOUT_ERROR'
    });
  }
};

// Refresca el token JWT (genera uno nuevo y desactiva el anterior)
const f_refreshToken = async (p_req, p_res) => {
  try {
    const v_authHeader = p_req.headers['authorization'];
    const v_oldToken = v_authHeader && v_authHeader.split(' ')[1];

    if (!v_oldToken) {
      return p_res.status(400).json({ 
        message: 'Token is required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verificar el token actual
    let v_decoded;
    try {
      v_decoded = jwt.verify(v_oldToken, c_JWT_SECRET);
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

    // Generar nuevo token
    const v_tokenPayload = {
      userId: v_decoded.userId,
      email: v_decoded.email
    };

    const v_newToken = jwt.sign(v_tokenPayload, c_JWT_SECRET, { 
      expiresIn: `${c_JWT_EXPIRY_HOURS}h` 
    });

    // Calcular nueva fecha de expiración
    const v_expiryDate = new Date();
    v_expiryDate.setHours(v_expiryDate.getHours() + c_JWT_EXPIRY_HOURS);

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
    console.error('Token refresh error:', p_error);
    p_res.status(500).json({ 
      message: 'Internal server error during token refresh',
      code: 'REFRESH_ERROR'
    });
  }
};

module.exports = {
  f_login,
  f_logout,
  f_refreshToken
};
