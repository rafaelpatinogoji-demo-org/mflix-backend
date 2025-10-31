const TheaterSession = require('../models/TheaterSession');
const Theater = require('../models/Theater');
const Movie = require('../models/Movie');

const f_getTheaterSessions = async (p_req, p_res) => {
  try {
    const { theaterId, date, movieId } = p_req.query;
    
    // Validate required parameters
    if (!theaterId) {
      return p_res.status(400).json({ 
        message: 'Theater ID is required' 
      });
    }
    
    // Build query filter
    const v_filter = { theater: theaterId };
    
    // Add date filter if provided
    if (date) {
      const v_date = new Date(date);
      if (isNaN(v_date.getTime())) {
        return p_res.status(400).json({ 
          message: 'Invalid date format' 
        });
      }
      
      const v_startOfDay = new Date(v_date.setHours(0, 0, 0, 0));
      const v_endOfDay = new Date(v_date.setHours(23, 59, 59, 999));
      
      v_filter.showtime = {
        $gte: v_startOfDay,
        $lte: v_endOfDay
      };
    }
    
    // Add movie filter if provided
    if (movieId) {
      v_filter.movie = movieId;
    }
    
    // Find sessions with movie details populated
    const v_sessions = await TheaterSession.find(v_filter)
      .populate({
        path: 'movie',
        select: 'title year genres runtime plot imdb'
      })
      .sort({ showtime: 1 });
    
    // Get theater information
    const v_theater = await Theater.findById(theaterId);
    if (!v_theater) {
      return p_res.status(404).json({ message: 'Theater not found' });
    }
    
    p_res.json({
      theater: v_theater,
      sessions: v_sessions,
      count: v_sessions.length
    });
  } catch (p_error) {
    console.error('Error retrieving theater sessions:', p_error);
    p_res.status(500).json({ message: p_error.message });
  }
};

const f_createTheaterSession = async (p_req, p_res) => {
  try {
    const { theater, movie, showtime, endTime, price, totalSeats } = p_req.body;
    
    // Validate references
    const v_theater = await Theater.findById(theater);
    if (!v_theater) {
      return p_res.status(404).json({ message: 'Theater not found' });
    }
    
    const v_movie = await Movie.findById(movie);
    if (!v_movie) {
      return p_res.status(404).json({ message: 'Movie not found' });
    }
    
    // Validate showtime and end time
    const v_showtime = new Date(showtime);
    const v_endTime = new Date(endTime);
    
    if (isNaN(v_showtime.getTime()) || isNaN(v_endTime.getTime())) {
      return p_res.status(400).json({ 
        message: 'Invalid date format for showtime or endTime' 
      });
    }
    
    if (v_showtime >= v_endTime) {
      return p_res.status(400).json({ 
        message: 'Showtime must be before end time' 
      });
    }
    
    // Validate price and seats
    if (price <= 0) {
      return p_res.status(400).json({ 
        message: 'Price must be a positive number' 
      });
    }
    
    if (totalSeats <= 0) {
      return p_res.status(400).json({ 
        message: 'Total seats must be a positive number' 
      });
    }
    
    // Create session
    const v_session = new TheaterSession({
      theater,
      movie,
      showtime: v_showtime,
      endTime: v_endTime,
      price,
      totalSeats,
      availableSeats: totalSeats
    });
    
    const v_savedSession = await v_session.save();
    
    // Populate references for response
    await v_savedSession.populate([
      { path: 'theater', select: 'theaterId location' },
      { path: 'movie', select: 'title year genres runtime' }
    ]);
    
    p_res.status(201).json(v_savedSession);
  } catch (p_error) {
    p_res.status(400).json({ message: p_error.message });
  }
};

const f_updateTheaterSession = async (p_req, p_res) => {
  try {
    const { id } = p_req.params;
    const { showtime, endTime, price, totalSeats } = p_req.body;
    
    // Build update object
    const v_update = {};
    
    if (showtime) {
      const v_showtime = new Date(showtime);
      if (isNaN(v_showtime.getTime())) {
        return p_res.status(400).json({ 
          message: 'Invalid date format for showtime' 
        });
      }
      v_update.showtime = v_showtime;
    }
    
    if (endTime) {
      const v_endTime = new Date(endTime);
      if (isNaN(v_endTime.getTime())) {
        return p_res.status(400).json({ 
          message: 'Invalid date format for endTime' 
        });
      }
      v_update.endTime = v_endTime;
    }
    
    if (price) v_update.price = price;
    if (totalSeats) v_update.totalSeats = totalSeats;
    
    // Update session
    const v_session = await TheaterSession.findByIdAndUpdate(
      id,
      v_update,
      { new: true, runValidators: true }
    ).populate([
      { path: 'theater', select: 'theaterId location' },
      { path: 'movie', select: 'title year genres runtime' }
    ]);
    
    if (!v_session) {
      return p_res.status(404).json({ message: 'Theater session not found' });
    }
    
    p_res.json(v_session);
  } catch (p_error) {
    p_res.status(400).json({ message: p_error.message });
  }
};

const f_deleteTheaterSession = async (p_req, p_res) => {
  try {
    const { id } = p_req.params;
    
    const v_session = await TheaterSession.findByIdAndDelete(id);
    if (!v_session) {
      return p_res.status(404).json({ message: 'Theater session not found' });
    }
    
    p_res.json({ message: 'Theater session deleted successfully' });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

module.exports = {
  f_getTheaterSessions,
  f_createTheaterSession,
  f_updateTheaterSession,
  f_deleteTheaterSession
};
