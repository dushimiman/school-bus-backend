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

// School schema
const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  contactEmail: { type: String, required: true, unique: true },
  contactPhone: { type: String, required: true },
  creationDate: { type: Date, default: Date.now },
});

const School = mongoose.model('School', schoolSchema);

// Bus schema
const busSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true, unique: true },
  gpsModel: { type: String, required: true },
  ownerName: { type: String, required: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }, // Associate bus with a school
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creationDate: { type: Date, default: Date.now },
});

const Bus = mongoose.model('Bus', busSchema);

mongoose.connect('mongodb+srv://dushimediane12:Rnm1fjcVeD15HIp9@cluster0.2ivfkiz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch((error) => console.error('Error connecting to MongoDB Atlas:', error));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, 'your_jwt_secret_key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.userId = user.userId;
    next();
  });
};

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
    console.error('Error registering user:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

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
    console.error('Error logging in:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/registerSchool', authenticateToken, async (req, res) => {
  const { name, address, contactEmail, contactPhone } = req.body;

  if (!name || !address || !contactEmail || !contactPhone) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingSchool = await School.findOne({ contactEmail });
    if (existingSchool) {
      return res.status(400).json({ message: 'School with this contact email already exists' });
    }

    const newSchool = new School({
      name,
      address,
      contactEmail,
      contactPhone,
    });

    await newSchool.save();
    res.status(201).json({ message: 'School registered successfully' });
  } catch (error) {
    console.error('Error registering school:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});


// Endpoint to add a bus and associate it with a school
app.post('/api/addBus', authenticateToken, async (req, res) => {
  const { plateNumber, gpsModel, ownerName, schoolId } = req.body;

  if (!plateNumber || !gpsModel || !ownerName || !schoolId) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(400).json({ message: 'School not found' });
    }

    const existingBus = await Bus.findOne({ plateNumber });
    if (existingBus) {
      return res.status(400).json({ message: 'Bus with this plate number already exists' });
    }

    const newBus = new Bus({
      plateNumber,
      gpsModel,
      ownerName,
      school: schoolId,
      addedBy: req.userId,
    });

    await newBus.save();
    res.status(201).json({ message: 'Bus details added successfully' });
  } catch (error) {
    console.error('Error adding bus:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});
app.get('/api/schools', authenticateToken, async (req, res) => {
  try {
    const schools = await School.find(); 
    res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
