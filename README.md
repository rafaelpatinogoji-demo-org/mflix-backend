# Mflix Backend API

This is the backend API for the Mflix movie database application.

## API Endpoints

### Theaters

- `GET /theaters` - Get all theaters with pagination
- `GET /theaters/nearby` - Find theaters near a specific location
  - Query parameters:
    - `latitude` (required) - Latitude coordinate
    - `longitude` (required) - Longitude coordinate
    - `radius` (required) - Search radius
    - `unit` (optional, default: km) - Distance unit (km or miles)
- `GET /theaters/:id` - Get a specific theater by ID
- `POST /theaters` - Create a new theater
- `PUT /theaters/:id` - Update a theater by ID
- `DELETE /theaters/:id` - Delete a theater by ID

### Theater Sessions

- `GET /theater-sessions` - Get all sessions for a specific theater
  - Query parameters:
    - `theaterId` (required) - Theater ID
    - `date` (optional) - Filter by specific date (YYYY-MM-DD)
    - `movieId` (optional) - Filter by specific movie
- `POST /theater-sessions` - Create a new theater session
- `PUT /theater-sessions/:id` - Update a theater session by ID
- `DELETE /theater-sessions/:id` - Delete a theater session by ID

### User Sessions

- `GET /sessions` - Get all user sessions with pagination
- `GET /sessions/active` - Get all active user JWT sessions
  - Query parameters:
    - `userId` (optional) - Filter by specific user
    - `startDate` (optional) - Filter by start date
    - `endDate` (optional) - Filter by end date
- `POST /sessions/logout-all` - Logout all sessions for a specific user
  - Body parameters:
    - `userId` (required) - User ID to logout all sessions for
- `GET /sessions/:id` - Get a specific user session by ID
- `POST /sessions` - Create a new user session
- `PUT /sessions/:id` - Update a user session by ID
- `DELETE /sessions/:id` - Delete a user session by ID

### Movies

- `GET /movies` - Get all movies with pagination
- `GET /movies/search` - Search movies by title, genre, or year
- `GET /movies/:id` - Get a specific movie by ID
- `POST /movies` - Create a new movie
- `PUT /movies/:id` - Update a movie by ID
- `DELETE /movies/:id` - Delete a movie by ID

### Movie Analytics

- `GET /movies/analytics/top-rated` - Get top-rated movies
  - Query parameters:
    - `page` (default: 1) - Page number
    - `limit` (default: 10) - Number of movies per page
    - `minVotes` (default: 0) - Minimum number of votes required
- `GET /movies/analytics/genres` - Get movies grouped by genre
  - Query parameters:
    - `genre` (optional) - Filter by specific genre
    - `sortBy` (default: 'count', options: 'count', 'rating') - Sort results by count or average rating
- `GET /movies/analytics/years` - Get movies grouped by release year
  - Query parameters:
    - `startYear` (optional) - Filter by start year
    - `endYear` (optional) - Filter by end year
    - `sortBy` (default: 'year', options: 'year', 'count', 'rating') - Sort results by year, count, or average rating
- `GET /movies/analytics/trending` - Get trending movies based on comment frequency
  - Query parameters:
    - `days` (default: 30) - Number of days to look back for comments
    - `limit` (default: 10) - Number of trending movies to return
- `GET /movies/analytics/engagement/:id` - Get engagement stats for a specific movie
  - Path parameters:
    - `id` - Movie ID

### Bookings

- `POST /bookings` - Create a new booking
  - Body parameters:
    - `movieId` (required) - Movie ID
    - `theaterId` (required) - Theater ID
    - `sessionId` (required) - Movie Session ID
    - `userId` (required) - User ID
    - `seats` (required) - Array of selected seat identifiers
    - `totalPrice` (required) - Total price for the booking
- `GET /bookings/user/:userId` - Get booking history for a specific user
  - Query parameters:
    - `status` (optional) - Filter by booking status (confirmed, pending, cancelled, completed)
    - `startDate` (optional) - Filter by start date
    - `endDate` (optional) - Filter by end date
    - `page` (default: 1) - Page number
    - `limit` (default: 10) - Number of bookings per page
    - `sort` (default: '-createdAt') - Sort order
- `GET /bookings/availability/:movieId` - Get movie availability across theaters
  - Query parameters:
    - `date` (optional) - Filter by specific date (YYYY-MM-DD)
    - `startDate` (optional) - Filter by start date
    - `endDate` (optional) - Filter by end date
- `PUT /bookings/:id/cancel` - Cancel a booking
  - Path parameters:
    - `id` - Booking ID
  - Body parameters:
    - `cancellationReason` (optional) - Reason for cancellation
- `GET /bookings/stats` - Get booking statistics
  - Query parameters:
    - `movieId` (optional) - Filter by specific movie
    - `theaterId` (optional) - Filter by specific theater
    - `startDate` (optional) - Filter by start date
    - `endDate` (optional) - Filter by end date

### Movie Sessions

- `POST /movie-sessions` - Create a new movie session
  - Body parameters:
    - `movieId` (required) - Movie ID
    - `theaterId` (required) - Theater ID
    - `sessionTime` (required) - Session time (ISO 8601 format)
    - `price` (required) - Ticket price
    - `totalSeats` (required) - Total number of seats
- `GET /movie-sessions` - Get all movie sessions
  - Query parameters:
    - `page` (default: 1) - Page number
    - `limit` (default: 10) - Number of sessions per page
- `GET /movie-sessions/:id` - Get a specific movie session by ID
- `PUT /movie-sessions/:id` - Update a movie session by ID
- `DELETE /movie-sessions/:id` - Delete a movie session by ID
- `GET /movie-sessions/movie/:movieId` - Get sessions for a specific movie
  - Query parameters:
    - `date` (optional) - Filter by specific date (YYYY-MM-DD)
    - `startDate` (optional) - Filter by start date
    - `endDate` (optional) - Filter by end date
    - `page` (default: 1) - Page number
    - `limit` (default: 10) - Number of sessions per page
