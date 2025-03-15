const express = require('express');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, firebaseUid } = req.body;
    const user = new User({ name, email, password, firebaseUid });
    await user.save();
    res.send({ message: 'User created successfully' });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).send({ message: 'Email or Firebase UID already exists' });
    } else {
      res.status(500).send({ message: 'Error creating user', error });
    }
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send({ message: 'Invalid email. Try again.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send({ message: 'Incorrect password. Try again.' });
    }

    res.send({ message: 'Logged in successfully!', user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        firebaseUid: user.firebaseUid
      }
    });
  } catch (error) {
    res.status(500).send({ message: 'Error logging in', error });
  }
});

module.exports = router;