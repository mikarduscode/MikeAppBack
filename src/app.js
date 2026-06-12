const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const glucoseRoutes = require('./routes/glucose.routes');
const bodyCompositionRoutes = require('./routes/bodyComposition.routes');
const savingsRoutes = require('./routes/savings.routes');
const errorHandler = require('./middlewares/error.middleware');
const AppError = require('./utils/appError');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger.json');

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to MikeApp REST API! The services are available under /api/v1',
  });
});

// Main REST Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/glucose', glucoseRoutes);
app.use('/api/v1/body-composition', bodyCompositionRoutes);
app.use('/api/v1/savings', savingsRoutes);

// Fallback for undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Centralized error handling middleware
app.use(errorHandler);

module.exports = app;
