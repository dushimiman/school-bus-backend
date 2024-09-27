const express = require('express');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// School Schema
const schoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  contactEmail: { type: String, required: true, unique: true },
  contactPhone: { type: String, required: true },
  creationDate: { type: Date, default: Date.now },
});
const School = mongoose.model('School', schoolSchema);

// Destination Schema
const destinationSchema = new mongoose.Schema({
  destinationName: {
    type: String,
    unique: true,
    required: true,
    trim: true
  }
});
const Destination = mongoose.model('Destination', destinationSchema);

// Bus Schema
const busSchema = new mongoose.Schema({
  plateNumber: { type: String, required: true, unique: true },
  gpsModel: { type: String, required: true },
  ownerName: { type: String, required: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
  creationDate: { type: Date, default: Date.now },
});
const Bus = mongoose.model('Bus', busSchema);
// Driver Schema
const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  licenseCategory: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  bus: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true }, // Reference to the Bus
});

const Driver = mongoose.model('Driver', driverSchema);


// Child Schema
const childSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  parentName: { type: String, required: true },
  parentPhone: { type: String, required: true },
  school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
  creationDate: { type: Date, default: Date.now },
});
const Child = mongoose.model('Child', childSchema);

// MongoDB Connection
mongoose.connect('mongodb+srv://dushimediane12:Rnm1fjcVeD15HIp9@cluster0.2ivfkiz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((error) => console.error('Error connecting to MongoDB Atlas:', error));

// Register a new user
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Log in a user
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: 'Invalid email or password' });

    // Simulate authentication for testing; adjust as necessary for your auth system
    res.json({ message: 'Login successful', userId: user._id });
  } catch (error) {
    console.error('Error logging in:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register a new school
app.post('/api/registerSchool', async (req, res) => {
  const { name, address, contactEmail, contactPhone } = req.body;

  if (!name || !address || !contactEmail || !contactPhone) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingSchool = await School.findOne({ contactEmail });
    if (existingSchool) {
      return res.status(400).json({ message: 'School with this contact email already exists' });
    }

    const newSchool = new School({ name, address, contactEmail, contactPhone });
    await newSchool.save();
    res.status(201).json({ message: 'School registered successfully' });
  } catch (error) {
    console.error('Error registering school:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new bus
app.post('/api/addBus', async (req, res) => {
  const { plateNumber, gpsModel, ownerName, schoolId, destinationId } = req.body;

  console.log('Received request body:', req.body); // Log the request body

  if (!plateNumber || !gpsModel || !ownerName || !schoolId || !destinationId) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(schoolId) || !mongoose.Types.ObjectId.isValid(destinationId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const newBus = new Bus({
      plateNumber,
      gpsModel,
      ownerName,
      school: schoolId,
      destination: destinationId,
    });

    await newBus.save();
    res.status(201).json({ message: 'Bus added successfully' });
  } catch (error) {
    console.error('Error adding bus:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a child
app.post('/api/addChild', async (req, res) => {
  const { firstName, lastName, parentName, parentPhone, schoolId, destinationId } = req.body;

  if (!firstName || !lastName || !parentName || !parentPhone || !schoolId || !destinationId) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(schoolId) || !mongoose.Types.ObjectId.isValid(destinationId)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const newChild = new Child({
      firstName,
      lastName,
      parentName,
      parentPhone,
      school: schoolId,
      destination: destinationId,
    });

    await newChild.save();
    res.status(201).json({ message: 'Child added successfully' });
  } catch (error) {
    console.error('Error adding child:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all schools
app.get('/api/schools', async (req, res) => {
  try {
    const schools = await School.find();
    res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all destinations
app.get('/api/destinations', async (req, res) => {
  try {
    const destinations = await Destination.find();
    res.json(destinations);
  } catch (error) {
    console.error('Error fetching destinations:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a destination
app.post('/api/addDestination', async (req, res) => {
  const { destinationName } = req.body;

  if (!destinationName || typeof destinationName !== 'string' || destinationName.trim() === '') {
    return res.status(400).json({ message: 'Valid destination name is required' });
  }

  try {
    // Trim whitespace and check for duplicate destination (case insensitive)
    const trimmedName = destinationName.trim();
    const existingDestination = await Destination.findOne({
      destinationName: { $regex: new RegExp('^' + trimmedName + '$', 'i') }
    });
    
    if (existingDestination) {
      return res.status(400).json({ message: 'Duplicate destination name found' });
    }

    // Save new destination
    const newDestination = new Destination({ destinationName: trimmedName });
    await newDestination.save();

    res.status(201).json({ message: 'Destination added successfully' });
  } catch (error) {
    console.error('Error adding destination:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get the count of all children
app.get('/api/children/count', async (req, res) => {
  try {
    const childrenCount = await Child.countDocuments();
    res.json({ count: childrenCount });
  } catch (error) {
    console.error('Error fetching children count:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get the count of all schools
app.get('/api/schools/count', async (req, res) => {
  try {
    const schoolsCount = await School.countDocuments();
    res.json({ count: schoolsCount });
  } catch (error) {
    console.error('Error fetching schools count:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get the count of all buses
app.get('/api/buses/count', async (req, res) => {
  try {
    const busesCount = await Bus.countDocuments();
    res.json({ count: busesCount });
  } catch (error) {
    console.error('Error fetching buses count:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get the dashboard data
app.get('/api/dashboard', async (req, res) => {
  try {
    const [childrenCount, schoolsCount, busesCount] = await Promise.all([
      Child.countDocuments(),
      School.countDocuments(),
      Bus.countDocuments()
    ]);

    res.json({
      children: childrenCount,
      schools: schoolsCount,
      buses: busesCount
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});
app.get('/api/children', async (req, res) => {
  try {
    const children = await Child.find().populate('school').populate('destination'); 
    res.json(children);
  } catch (error) {
    console.error('Error fetching children:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});
app.get('/api/buses', async (req, res) => {
  try {
    const buses = await Bus.find().populate('school').populate('destination'); // Populate school and destination details if needed
    res.json(buses);
  } catch (error) {
    console.error('Error fetching buses:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/buses', async (req, res) => {
  try {
    const buses = await Bus.find().populate('school').populate('destination'); // Populate school and destination details if needed
    res.json(buses);
  } catch (error) {
    console.error('Error fetching buses:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});
app.post('/api/drivers', async (req, res) => {
  const { name, licenseCategory, phoneNumber, busPlateNumber } = req.body;

  // Validate input data
  if (!name || !licenseCategory || !phoneNumber || !busPlateNumber) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Optional: Add regex validation for phone number format
  const phoneRegex = /^[0-9]{10}$/; // Example for a 10-digit phone number
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({ message: 'Invalid phone number format.' });
  }

  try {
    const newDriver = new Driver({
      name,
      licenseCategory,
      phoneNumber,
      busPlateNumber,
    });

    await newDriver.save();
    res.status(201).json({ message: 'Driver registered successfully!' });
  } catch (error) {
    console.error('Error registering driver:', error);
    res.status(500).json({ message: 'Failed to register driver. Please try again.' });
  }
});
app.get("/api/buses", async (req, res) => {
  try {
    const buses = await Bus.find({}, "plateNumber"); 
    const plateNumbers = buses.map(bus => bus.plateNumber);
    res.json(plateNumbers); 
  } catch (error) {
    res.status(500).json({ error: "Error fetching bus plate numbers" });
  }
});
// Server listening on port 5000
app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
