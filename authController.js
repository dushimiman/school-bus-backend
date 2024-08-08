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
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
    const token = authHeader && authHeader.split(' ')[1];

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

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ message: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    email,
    password: hashedPassword,
  });

  await newUser.save();
  res.status(201).json({ message: 'User registered successfully' });
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Invalid email or password' });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return res.status(400).json({ message: 'Invalid email or password' });

  const token = jwt.sign({ userId: user._id }, 'your_jwt_secret_key');
  res.json({ token });
});

// Protected Route: Add New Device
app.post('/api/devices', authenticateToken, async (req, res) => {
  const { serialNumber, simNumber, deviceModel } = req.body;

  const newDevice = new Device({
    serialNumber,
    simNumber,
    deviceModel,
    addedBy: req.userId,
  });

  await newDevice.save();
  res.status(201).json({ message: 'Device added successfully' });
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
