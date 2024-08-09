const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB User schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// MongoDB Device schema
const deviceSchema = new mongoose.Schema({
  serialNumber: { type: String, required: true },
  simNumber: { type: String, required: true },
  deviceModel: { type: String, required: true },
  creationDate: { type: Date, default: Date.now },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

const Device = mongoose.model('Device', deviceSchema);

// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://dushimediane12:Rnm1fjcVeD15HIp9@cluster0.2ivfkiz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((error) => console.error('Error connecting to MongoDB Atlas:', error));

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log('Authorization Header:', authHeader); // Debugging line
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Token:', token); // Debugging line

    if (token == null) return res.sendStatus(401); // No token found

    jwt.verify(token, 'your_jwt_secret_key', (err, user) => {
        if (err) return res.sendStatus(403); // Invalid token
        req.userId = user.userId;
        next(); // Proceed to the next middleware or route handler
    });
};

// Registration Route
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error.message); // Detailed error message
    res.status(500).json({ message: 'Server error' });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret_key');
    res.json({ token });
  } catch (error) {
    console.error('Error logging in:', error.message); // Detailed error message
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected Route: Add New Device
app.post('/api/devices', authenticateToken, async (req, res) => {
  const { serialNumber, simNumber, deviceModel } = req.body;

  if (!serialNumber || !simNumber || !deviceModel) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const newDevice = new Device({
      serialNumber,
      simNumber,
      deviceModel,
      addedBy: req.userId,
    });

    await newDevice.save();
    res.status(201).json({ message: 'Device added successfully' });
  } catch (error) {
    console.error('Error adding device:', error.message); // Detailed error message
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to get all devices
app.get('/api/devices', authenticateToken, async (req, res) => {
    try {
        // Fetch all devices from the database
        const devices = await Device.find().populate('addedBy', 'email'); // Populate addedBy with user email
        res.json(devices);
    } catch (error) {
        console.error('Error fetching devices:', error.message); // Detailed error message
        res.status(500).json({ message: 'Failed to fetch devices' });
    }
});
app.post('/api/gps-data', (req, res) => {
  const { deviceId, latitude, longitude, speed, timestamp } = req.body;

  Device.findById(deviceId).then(device => {
      if (device) {
          device.location = { latitude, longitude };
          device.speed = speed;
          device.timestamp = timestamp;
          return device.save();
      } else {
          res.status(404).send({ message: 'Device not found' });
      }
  }).then(savedDevice => {
      res.send(savedDevice);
  }).catch(error => {
      console.error(error);
      res.status(500).send({ message: 'Error saving GPS data' });
  });
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
