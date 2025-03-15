const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const moodLogRoutes = require('./routes/mood');
const correlationRoutes = require('./routes/correlation');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Basic health check endpoint
app.get('/', (req, res) => {
  res.send('Mindful Map API is running');
});

// Connect to MongoDB with better error handling
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  // Don't crash the server on connection error
});

app.use('/auth', authRoutes);
app.use('/moodlogs', moodLogRoutes);
app.use('/correlation', correlationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});