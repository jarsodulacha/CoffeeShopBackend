const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require('cors');  

const app = express();
app.use(bodyParser.json()); // Parse JSON data from the request body
app.use(cors({ origin: 'http://localhost:3000' }));  // Allow requests from frontend

// MongoDB connection string
const mongoURI = "mongodb://localhost:27017/SDP"; // Update this to your MongoDB URI
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to Coffee Shop Payment Processing API');
});


const OrderSchema = new mongoose.Schema({
  Items: { type: [String], required: true },
  CustomerName: { type: String, required: true },
  Price: { type: Number, required: true },
  OrderStatus: { type: String, required: true },
  PaymentStatus: { type: String, required: true },
  OrderedDate: { type: Date, default: Date.now },
  UpdatedAt: { type: Date, default: Date.now },
});


const Order = mongoose.model('Order', OrderSchema);
module.exports = Order;

// Define a schema for the User collection
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);

// Define routes (login, users, etc.)
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    // Assume a simple token for now
    const token = 'your-jwt-token'; // Replace with actual JWT generation logic
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'An error occurred during login' });
  }
});


// Route to fetch all users
app.get("/users", async (req, res) => {
  try {
      const users = await User.find();  // Fetching all users from the 'users' collection
      res.status(200).json(users);  // Respond with the users data
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
});

// POST route to create a new user
app.post('/users', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Create a new user instance
    const newUser = new User({ username, password });

    // Save the user to the database
    await newUser.save();

    // Return success response
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});


// GET route to fetch all orders
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message });
  }
});


app.post('/orders', async (req, res) => {
  try {
    // Validate incoming order data
    const { Items, CustomerName, Price, OrderStatus, PaymentStatus } = req.body;

    // Check if required fields are provided
    if (!Items || !CustomerName || !Price || !OrderStatus || !PaymentStatus) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create a new order instance
    const newOrder = new Order({
      Items,
      CustomerName,
      Price,
      OrderStatus,
      PaymentStatus,
    });

    // Save the order to the database
    await newOrder.save();

    res.status(201).json({ message: 'Order added successfully', order: newOrder });
  } catch (error) {
    console.error('Error adding order:hh', error);
    res.status(400).json({ message: 'Error adding order', error: error.message });
  }
});

// PUT route to update an existing order
app.put("/orders/:id", async (req, res) => {
    try {
      const updatedOrder = await Order.findByIdAndUpdate(
        req.params.id, // The ID of the order to update
        req.body, // The data to update
        { new: true, runValidators: true } // Options: return the updated document, validate before saving
      );
  
      if (!updatedOrder) {
        return res.status(404).json({
          message: "Order not found, unable to update.",
        });
      }
  
      res.status(200).json({
        message: "Order updated successfully!",
        order: updatedOrder,
      });
    } catch (err) {
      res.status(400).json({
        message: "Failed to update order.",
        error: err.message,
      });
    }
  });  
//Update route for only Orderstatus
app.put('/orders/:id', async (req, res) => {
  try {
      const { id } = req.params;
      const { OrderStatus } = req.body;

      if (!OrderStatus) {
          return res.status(400).json({ message: "OrderStatus is required." });
      }
      const updatedOrder = await Order.findByIdAndUpdate(
          id, 
          { OrderStatus, UpdatedAt: Date.now() }, // Update status and timestamp
          { new: true } // Return the updated document
      );
      if (!updatedOrder) {
          return res.status(404).json({ message: "Order not found." });
      }
      res.status(200).json({ message: "Order status updated successfully!", order: updatedOrder });
  } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: "Internal server error." });
  }
});

// DELETE route to delete an order
app.delete('/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const result = await Order.deleteOne({ _id: orderId });
    if (result.deletedCount > 0) {
      res.status(200).json({ message: 'Order deleted successfully' });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting order', error });
  }
});


// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
