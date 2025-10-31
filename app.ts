import express, { Application, Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import cors from 'cors';
import connectDB from './src/config/database';
import movieRoutes from './src/routes/movieRoutes';
import commentRoutes from './src/routes/commentRoutes';
import userRoutes from './src/routes/userRoutes';
import theaterRoutes from './src/routes/theaterRoutes';
import sessionRoutes from './src/routes/sessionRoutes';
import embeddedMovieRoutes from './src/routes/embeddedMovieRoutes';

const v_app: Application = express();
const c_PORT = process.env.PORT || 3000;

connectDB();

v_app.use(cors());
v_app.use(express.json());
v_app.use(express.urlencoded({ extended: true }));

v_app.use('/api/movies', movieRoutes);
v_app.use('/api/comments', commentRoutes);
v_app.use('/api/users', userRoutes);
v_app.use('/api/theaters', theaterRoutes);
v_app.use('/api/sessions', sessionRoutes);
v_app.use('/api/embedded-movies', embeddedMovieRoutes);

v_app.get('/', (p_req: Request, p_res: Response) => {
  p_res.json({
    message: 'MFlix API Server',
    version: '1.0.0',
    endpoints: {
      movies: '/api/movies',
      comments: '/api/comments',
      users: '/api/users',
      theaters: '/api/theaters',
      sessions: '/api/sessions',
      embeddedMovies: '/api/embedded-movies'
    }
  });
});

v_app.use('*', (p_req: Request, p_res: Response) => {
  p_res.status(404).json({ message: 'Route not found' });
});

const errorHandler: ErrorRequestHandler = (p_err, p_req, p_res, p_next) => {
  console.error(p_err.stack);
  p_res.status(500).json({ message: 'Internal server error' });
};

v_app.use(errorHandler);

v_app.listen(c_PORT, () => {
  console.log(`Server running on port ${c_PORT}`);
});

export default v_app;
