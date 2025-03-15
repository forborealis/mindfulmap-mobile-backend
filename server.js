const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config(); // Add this line
const authRoutes = require('./routes/auth');
const moodLogRoutes = require('./routes/mood');
const correlationRoutes = require('./routes/correlation');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Use environment variables for sensitive information
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use('/auth', authRoutes);
app.use('/moodlogs', moodLogRoutes)
app.use('/correlation', correlationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});