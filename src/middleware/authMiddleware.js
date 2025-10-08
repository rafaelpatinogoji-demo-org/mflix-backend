const Session = require('../models/Session');

const f_authenticateUser = async (p_req, p_res, p_next) => {
  try {
    const v_authHeader = p_req.headers.authorization;
    if (!v_authHeader || !v_authHeader.startsWith('Bearer ')) {
      return p_res.status(401).json({ message: 'Authorization token required' });
    }

    const v_token = v_authHeader.substring(7);
    const v_session = await Session.findOne({ jwt: v_token });
    
    if (!v_session) {
      return p_res.status(401).json({ message: 'Invalid or expired token' });
    }

    p_req.user = {
      id: v_session.user_id,
      sessionId: v_session._id
    };
    
    p_next();
  } catch (p_error) {
    console.error('Authentication error:', p_error);
    p_res.status(500).json({ message: 'Authentication failed' });
  }
};

const f_validateUserAccess = (p_req, p_res, p_next) => {
  const v_requestedUserId = p_req.query.user_id || p_req.body.user_id || p_req.params.user_id;
  
  if (v_requestedUserId && v_requestedUserId !== p_req.user.id.toString()) {
    return p_res.status(403).json({ message: 'Access denied: Cannot access other user data' });
  }
  
  p_next();
};

module.exports = {
  f_authenticateUser,
  f_validateUserAccess
};
