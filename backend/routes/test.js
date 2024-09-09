import express from 'express';
import db from '../db/connection.js';

const router = express.Router();

// Route to insert data into the database when accessing the root page
router.get('/', async (req, res) => {
  try {
    // Generate random data for username, password, and email
    const randomUsername = 'user_' + Math.floor(Math.random() * 1000);
    const randomPassword = 'password_' + Math.floor(Math.random() * 1000);
    const randomEmail = 'user' + Math.floor(Math.random() * 1000) + '@example.com';

    // Data to be inserted into the users table
    const userData = {
      username: randomUsername,
      password: randomPassword,
      email: randomEmail
    };

    // SQL query to insert data into the users table
    const insertQuery = `
      INSERT INTO users (username, password, email)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    // Execute the query and pass the values from the userData object
    const newUser = await db.one(insertQuery, [userData.username, userData.password, userData.email]);

    res.status(201).json(newUser); // Respond with the newly inserted user
  } catch (error) {
    console.error('Error inserting data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to get all users from the database
router.get('/all', async (req, res) => {
  try {
    // SQL query to fetch all users from the users table
    const allUsers = await db.any('SELECT * FROM users');
    res.status(200).json(allUsers); // Respond with all users
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
