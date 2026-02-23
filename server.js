require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB via Compass URI'))
  .catch(err => console.error('Could not connect to MongoDB:', err));


const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  item: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'PENDING' }
});

const Order = mongoose.model('Order', orderSchema);


const simulateProcessingDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// api endpoints


app.post('/orders', async (req, res) => {
  try {
    const { customerName, item, amount } = req.body;
    
    
    console.log("Processing order...");
    await simulateProcessingDelay(2000); 

    const newOrder = new Order({ customerName, item, amount });
    const savedOrder = await newOrder.save();
    
    res.status(201).json({ message: "Order created successfully", order: savedOrder });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID format" });
  }
});

app.patch('/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    );
    if (!updatedOrder) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order updated", order: updatedOrder });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/orders/:id', async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order cancelled and deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
