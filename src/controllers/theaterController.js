const Theater = require('../models/Theater');

// Función para obtener teatros cercanos basado en coordenadas geográficas y radio de búsqueda
const f_getNearbyTheaters = async (p_req, p_res) => {
  try {
    const { latitude, longitude, radius, unit = 'km' } = p_req.query;
    
    // Validate required parameters
    if (!latitude || !longitude || !radius) {
      return p_res.status(400).json({ 
        message: 'Latitude, longitude, and radius are required parameters' 
      });
    }
    
    // Convert to numbers
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = parseFloat(radius);
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
      return p_res.status(400).json({ 
        message: 'Latitude, longitude, and radius must be valid numbers' 
      });
    }
    
    // Validate coordinate ranges
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return p_res.status(400).json({ 
        message: 'Invalid latitude or longitude values' 
      });
    }
    
    // Validate radius
    if (rad <= 0) {
      return p_res.status(400).json({ 
        message: 'Radius must be a positive number' 
      });
    }
    
    // Convert radius to meters for MongoDB (if needed)
    const radiusInMeters = unit === 'miles' ? rad * 1609.34 : rad * 1000;
    
    // Find nearby theaters using geospatial query
    const v_theaters = await Theater.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          distanceField: 'distance',
          maxDistance: radiusInMeters,
          spherical: true
        }
      },
      {
        $project: {
          theaterId: 1,
          location: 1,
          distance: 1
        }
      }
    ]);
    
    // Convert distance to appropriate unit for response
    const theatersWithDistance = v_theaters.map(theater => {
      const distance = unit === 'miles' ? 
        theater.distance / 1609.34 : 
        theater.distance / 1000;
      
      return {
        ...theater,
        distance: parseFloat(distance.toFixed(2)),
        unit
      };
    });
    
    p_res.json({
      theaters: theatersWithDistance,
      count: theatersWithDistance.length
    });
  } catch (p_error) {
    console.error('Error finding nearby theaters:', p_error);
    p_res.status(500).json({ message: p_error.message });
  }
};

// Función para obtener todos los teatros con paginación
const f_getAllTheaters = async (p_req, p_res) => {
  try {
    const v_page = parseInt(p_req.query.page) || 1;
    const v_limit = parseInt(p_req.query.limit) || 10;
    const v_skip = (v_page - 1) * v_limit;

    const v_theaters = await Theater.find()
      .skip(v_skip)
      .limit(v_limit);

    const v_total = await Theater.countDocuments();

    p_res.json({
      theaters: v_theaters,
      currentPage: v_page,
      totalPages: Math.ceil(v_total / v_limit),
      totalTheaters: v_total
    });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Función para obtener un teatro específico por su ID
const f_getTheaterById = async (p_req, p_res) => {
  try {
    const v_theater = await Theater.findById(p_req.params.id);
    if (!v_theater) {
      return p_res.status(404).json({ message: 'Theater not found' });
    }
    p_res.json(v_theater);
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

// Función para crear un nuevo teatro
const f_createTheater = async (p_req, p_res) => {
  try {
    const v_theater = new Theater(p_req.body);
    const v_savedTheater = await v_theater.save();
    p_res.status(201).json(v_savedTheater);
  } catch (p_error) {
    p_res.status(400).json({ message: p_error.message });
  }
};

// Función para actualizar un teatro existente por su ID
const f_updateTheater = async (p_req, p_res) => {
  try {
    const v_theater = await Theater.findByIdAndUpdate(
      p_req.params.id,
      p_req.body,
      { new: true, runValidators: true }
    );
    if (!v_theater) {
      return p_res.status(404).json({ message: 'Theater not found' });
    }
    p_res.json(v_theater);
  } catch (p_error) {
    p_res.status(400).json({ message: p_error.message });
  }
};

// Función para eliminar un teatro por su ID
const f_deleteTheater = async (p_req, p_res) => {
  try {
    const v_theater = await Theater.findByIdAndDelete(p_req.params.id);
    if (!v_theater) {
      return p_res.status(404).json({ message: 'Theater not found' });
    }
    p_res.json({ message: 'Theater deleted successfully' });
  } catch (p_error) {
    p_res.status(500).json({ message: p_error.message });
  }
};

module.exports = {
  f_getAllTheaters,
  f_getTheaterById,
  f_createTheater,
  f_updateTheater,
  f_deleteTheater,
  f_getNearbyTheaters
};
