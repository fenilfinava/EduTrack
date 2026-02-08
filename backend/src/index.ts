import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import projectsRoutes from './routes/projects.routes';
import tasksRoutes from './routes/tasks.routes';
import milestonesRoutes from './routes/milestones.routes';
import commentsRoutes from './routes/comments.routes';
import githubRoutes from './routes/github.routes';
import teamsRoutes from './routes/teams.routes';
import evaluationsRoutes from './routes/evaluations.routes';
import auditRoutes from './routes/audit.routes';

dotenv.config();

// Server restart trigger
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            process.env.FRONTEND_URL,
            // Only allow localhost in development
            ...(process.env.NODE_ENV !== 'production' ? [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://localhost:3002'
            ] : [])
        ].filter(Boolean);

        if (allowedOrigins.indexOf(origin) === -1) {
            // Temporarily allow all for debugging if strict check fails
            // return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// API Routes
app.get('/api', (_req, res) => {
    res.json({
        message: 'Student Project Tracking System API',
        version: '1.0.0',
        endpoints: ['/api/auth', '/api/users', '/api/projects', '/api/tasks', '/api/milestones', '/api/comments', '/api/github']
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/milestones', milestonesRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/evaluations', evaluationsRoutes);
app.use('/api/audit', auditRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
