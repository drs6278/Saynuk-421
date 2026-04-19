require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// --- Swagger Configuration ---
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ordering System API',
      version: '1.0.0',
      description: 'This is the swagger UI for a business ordering system',
    },
    components: {
      schemas: {
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            customerName: { type: 'string' },
            item: { type: 'string' },
            amount: { type: 'number' },
            status: { type: 'string' },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
          },
        },
      },
    },
    servers: [
      {
        url: process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./server.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// --- Database Connection ---
const MONGODB_URI = `mongodb+srv://netcentric-user:${process.env.DB_PASSWORD}@net-centric-saynuk.odkiort.mongodb.net/?appName=Net-Centric-Saynuk`;
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// --- Models ---
const Order = mongoose.model('Order', new mongoose.Schema({
  customerName: { type: String, required: true },
  item: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'PENDING' }
}));

const Customer = mongoose.model('Customer', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true }
}));

const simulateProcessingDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- API Endpoints with Correct YAML Indentation ---

/**
 * @openapi
 * /orders:
 * post:
 * summary: Create a new order
 * tags: [Orders]
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required:
 * - customerName
 * - item
 * - amount
 * properties:
 * customerName:
 * type: string
 * item:
 * type: string
 * amount:
 * type: number
 * responses:
 * 201:
 * description: Order created successfully
 * 400:
 * description: Bad request
 */
app.post('/orders', async (req, res) => {
  try {
    const { customerName, item, amount } = req.body;
    await simulateProcessingDelay(2000); 
    const newOrder = new Order({ customerName, item, amount });
    const savedOrder = await newOrder.save();
    res.status(201).json({ message: "Order created successfully", order: savedOrder });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @openapi
 * /orders:
 * get:
 * summary: Retrieve a list of orders
 * tags: [Orders]
 * responses:
 * 200:
 * description: A list of orders
 * content:
 * application/json:
 * schema:
 * type: array
 * items:
 * $ref: '#/components/schemas/Order'
 */
app.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /orders/{id}:
 * get:
 * summary: Get an order by ID
 * tags: [Orders]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Order found
 * 404:
 * description: Order not found
 */
app.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID format" });
  }
});

/**
 * @openapi
 * /orders/{id}:
 * patch:
 * summary: Update an order status
 * tags: [Orders]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * properties:
 * status:
 * type: string
 * responses:
 * 200:
 * description: Order updated
 */
app.patch('/orders/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!updatedOrder) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order updated", order: updatedOrder });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @openapi
 * /orders/{id}:
 * delete:
 * summary: Delete an order
 * tags: [Orders]
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: string
 * responses:
 * 200:
 * description: Order deleted
 */
app.delete('/orders/:id', async (req, res) => {
  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order cancelled and deleted" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Start Server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});