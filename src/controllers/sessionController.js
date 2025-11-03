const Session = require('../models/Session');

// Obtiene todas las sesiones con paginación
const f_getAllSessions = async (p_req, p_res) => {
  try {
    const v_page = parseInt(p_req.query.page) || 1;
    const v_limit = parseInt(p_req.query.limit) || 10;
    const v_skip = (v_page - 1) * v_limit;

    const v_sessions = await Session.find()
      .skip(v_skip)
      .limit(v_limit);

    const v_total = await Session.countDocuments();

    p_res.json({
      sessions: v_sessions,
      currentPage: v_page,
      totalPages: Math.ceil(v_total / v_limit),
      totalSessions: v_total
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Obtiene una sesión específica por su ID
const f_getSessionById = async (p_req, p_res) => {
  try {
    const v_session = await Session.findById(p_req.params.id);
    if (!v_session) {
      return p_res.status(404).json({ message: 'Session not found' });
    }
    p_res.json(v_session);
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Crea una nueva sesión
const f_createSession = async (p_req, p_res) => {
  try {
    const v_session = new Session(p_req.body);
    const v_savedSession = await v_session.save();
    p_res.status(201).json(v_savedSession);
  } catch (p_error) {
    p_res.status(400).json({ message: p_error.message });
  }
};

// Actualiza una sesión existente por su ID
const f_updateSession = async (p_req, p_res) => {
  try {
    const v_session = await Session.findByIdAndUpdate(
      p_req.params.id,
      p_req.body,
      { new: true, runValidators: true }
    );
    if (!v_session) {
      return p_res.status(404).json({ message: 'Session not found' });
    }
    p_res.json(v_session);
  } catch (p_error) {
    p_res.status(400).json({ message: p_error.message });
  }
};

// Elimina una sesión por su ID
const f_deleteSession = async (p_req, p_res) => {
  try {
    const v_session = await Session.findByIdAndDelete(p_req.params.id);
    if (!v_session) {
      return p_res.status(404).json({ message: 'Session not found' });
    }
    p_res.json({ message: 'Session deleted successfully' });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Obtiene las sesiones activas de usuarios con filtros opcionales por usuario y rango de fechas
const f_getActiveUserSessions = async (p_req, p_res) => {
  try {
    const { userId, startDate, endDate } = p_req.query;
    
    // Build query filter for active sessions
    const v_filter = { status: 'active' };
    
    // Add user filter if provided
    if (userId) {
      v_filter.user_id = userId;
    }
    
    // Add date range filter if provided
    if (startDate || endDate) {
      v_filter.createdAt = {};
      
      if (startDate) {
        const v_startDate = new Date(startDate);
        if (isNaN(v_startDate.getTime())) {
          return p_res.status(400).json({ 
            message: 'Invalid start date format' 
          });
        }
        v_filter.createdAt.$gte = v_startDate;
      }
      
      if (endDate) {
        const v_endDate = new Date(endDate);
        if (isNaN(v_endDate.getTime())) {
          return p_res.status(400).json({ 
            message: 'Invalid end date format' 
          });
        }
        v_filter.createdAt.$lte = v_endDate;
      }
    }
    
    // Find active sessions
    const v_sessions = await Session.find(v_filter)
      .sort({ createdAt: -1 });
    
    // Filter out expired sessions
    const v_currentTime = new Date();
    const v_activeSessions = v_sessions.filter(session => 
      new Date(session.expiry) > v_currentTime
    );
    
    p_res.json({
      sessions: v_activeSessions,
      count: v_activeSessions.length
    });
  } catch (p_error) {
    console.error('Error retrieving active user sessions:', p_error);
    p_res.status(500).json({ message: p_error.message });
  }
};

// Cierra todas las sesiones activas de un usuario específico
const f_logoutAllSessions = async (p_req, p_res) => {
  try {
    const { userId } = p_req.body;
    
    // Validate required parameters
    if (!userId) {
      return p_res.status(400).json({ 
        message: 'User ID is required' 
      });
    }
    
    // Update all active sessions for the user to inactive
    const v_result = await Session.updateMany(
      { user_id: userId, status: 'active' },
      { status: 'inactive' }
    );
    
    // Log action for security audit
    console.log(`User ${userId} logged out all sessions at ${new Date().toISOString()}`);
    
    p_res.json({
      message: 'All sessions terminated successfully',
      sessionsTerminated: v_result.modifiedCount
    });
  } catch (p_error) {
    console.error('Error logging out all sessions:', p_error);
    p_res.status(500).json({ message: p_error.message });
  }
};

module.exports = {
  f_getAllSessions,
  f_getSessionById,
  f_createSession,
  f_updateSession,
  f_deleteSession,
  f_getActiveUserSessions,
  f_logoutAllSessions
};
