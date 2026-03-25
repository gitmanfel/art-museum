const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// IN-MEMORY USER STORE (MOCK DATABASE)
// Replace this with PostgreSQL or MongoDB in a real application
const usersDB = [];

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const TOKEN_EXPIRATION = '1h'; // Short expiration for security

/**
 * Register a new user securely
 */
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 2. Check if user exists
    const userExists = usersDB.find(u => u.email === email);
    if (userExists) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // 3. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 4. Save to Database
    const newUser = {
      id: Date.now().toString(), // Mock ID
      email: email,
      password: hashedPassword // Store only the hash, NEVER plain text
    };
    usersDB.push(newUser);

    // 5. Generate Initial Token (Optional on registration)
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token, // Send token back for immediate login
      user: { id: newUser.id, email: newUser.email }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

/**
 * Login a user securely
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 2. Find user
    const user = usersDB.find(u => u.email === email);
    if (!user) {
        // Return generic message to prevent username enumeration
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 4. Generate Secure JWT Token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRATION }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};
