const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cron = require('node-cron');
const axios = require('axios');
const adminRouter = require('./routes/adminRoutes');
const userRouter = require('./routes/userRoutes');
const authRouter = require('./routes/authRoutes');
const pickem1Router = require('./routes/pickem1Routes');
const codeRouter = require('./routes/codeRoutes');
const contestRouter = require('./routes/contestRoutes');
const errController = require('./controllers/errController');

const app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '5mb' }));

app.use(cookieParser());

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
  })
);

// Scheduled task
cron.schedule('32 0 * * *', async () => {
  try {
    console.log('Running scheduled task...');

    // Replace with your actual request
    const response = await axios.patch(
      'http://localhost:5000/api/v1/pickem1',
      {
        url: 'http://localhost:5000',
      }
    );

    console.log('Request sent successfully:', response.data);
  } catch (error) {
    console.error('Error running scheduled task:', error.message);
  }
});

// Routes
app.use('/api/v1/admins', adminRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/pickem1', pickem1Router);
app.use('/api/v1/codes', codeRouter);
app.use('/api/v1/contests', contestRouter);

app.use(errController);

app.use('*', (req, res) => {
  res.status(404).send('route does not exist');
});

module.exports = app;
