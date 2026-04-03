require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Orderign System API',
      version: '1.0.0',
      description: 'this is the swaggger ui for a business ordering system',
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
        url: `http://localhost:${PORT}`,
      },
    ],
  },
  apis: ['./server.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


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

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true }
});

const Customer = mongoose.model('Customer', customerSchema);


const simulateProcessingDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// api endpoints


/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - item
 *               - amount
 *             properties:
 *               customerName:
 *                 type: string
 *               item:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad request
 */
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


/**
 * @openapi
 * /orders:
 *   get:
 *     summary: Retrieve a list of orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: A list of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       500:
 *         description: Internal server error
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
 *   get:
 *     summary: Get an order by ID
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID
 *     responses:
 *       200:
 *         description: Order found
 *       404:
 *         description: Order not found
 *       400:
 *         description: Invalid ID format
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
 *   patch:
 *     summary: Update an order status
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated
 *       404:
 *         description: Order not found
 *       400:
 *         description: Bad request
 */
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

/**
 * @openapi
 * /orders/{id}:
 *   delete:
 *     summary: Delete an order
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID
 *     responses:
 *       200:
 *         description: Order deleted
 *       404:
 *         description: Order not found
 *       400:
 *         description: Bad request
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

// Customer API endpoints

/**
 * @openapi
 * /customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Bad request
 */
app.post('/customers', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const newCustomer = new Customer({ name, email, phone, address });
    const savedCustomer = await newCustomer.save();
    res.status(201).json({ message: "Customer created successfully", customer: savedCustomer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @openapi
 * /customers:
 *   get:
 *     summary: Retrieve a list of customers
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: A list of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Customer'
 *       500:
 *         description: Internal server error
 */
app.get('/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /customers/{id}:
 *   get:
 *     summary: Get a customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The customer ID
 *     responses:
 *       200:
 *         description: Customer found
 *       404:
 *         description: Customer not found
 *       400:
 *         description: Invalid ID format
 */
app.get('/customers/:id', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (error) {
    res.status(400).json({ error: "Invalid ID format" });
  }
});

/**
 * @openapi
 * /customers/{id}:
 *   patch:
 *     summary: Update a customer's information
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated
 *       404:
 *         description: Customer not found
 *       400:
 *         description: Bad request
 */
app.patch('/customers/:id', async (req, res) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedCustomer) return res.status(404).json({ error: "Customer not found" });
    res.json({ message: "Customer updated", customer: updatedCustomer });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @openapi
 * /customers/{id}:
 *   delete:
 *     summary: Delete a customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The customer ID
 *     responses:
 *       200:
 *         description: Customer deleted
 *       404:
 *         description: Customer not found
 *       400:
 *         description: Bad request
 */
app.delete('/customers/:id', async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    if (!deletedCustomer) return res.status(404).json({ error: "Customer not found" });
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
