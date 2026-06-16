require('dotenv').config(); // Load environment variables from a .env file

const express = require('express'); // Import the Express library to create a web server
const mongoose = require('mongoose'); // Import the Mongoose library to interact with MongoDB

const app = express(); // Create an instance of the Express application

const port = process.env.PORT || 3000; // Set the port to the value of the PORT environment variable, or default to 3000 if it's not set

mongoose.connect(process.env.MONGO_URI) // Connect to the MongoDB database using the connection string from the MONGO_URI environment variable
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

app.get('/', (req, res) => { // Define a route for the root URL ("/") that responds to GET requests
  res.send('Hello, Portfolio Server is Running!'); // Send a response with a message indicating that the server is running
});

app.listen(port, () => { // Start the server and listen on the specified port, and log a message to the console when the server is running
  console.log(`Server is running on port ${port}`);
});