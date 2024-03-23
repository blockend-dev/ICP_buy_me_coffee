import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';

class Product {
   id: string;
   name: string;
   description: string;
   price: number;
   imageURL: string;
   createdAt: Date;
   updatedAt: Date | null;
}

const productsStorage = new StableBTreeMap<string, Product>(0);

const app = express();
app.use(express.json());

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Internal Server Error');
});

// Route to create a new product
app.post("/products", (req, res) => {
    try {
        const product: Product =  {id: uuidv4(), createdAt: getCurrentDate(), ...req.body};
        productsStorage.insert(product.id, product);
        res.status(201).json(product);
    } catch (error) {
        res.status(400).send(`Invalid product data: ${error.message}`);
    }
});

// Route to get all products
app.get("/products", (req, res) => {
    res.json(productsStorage.values());
});

// Route to get a specific product by ID
app.get("/products/:id", (req, res) => {
    const productId = req.params.id;
    const product = productsStorage.get(productId);
    if (product) {
        res.json(product);
    } else {
        res.status(404).send(`Product with id=${productId} not found`);
    }
});

// Route to update a product by ID
app.put("/products/:id", (req, res) => {
    try {
        const productId = req.params.id;
        const existingProduct = productsStorage.get(productId);
        if (existingProduct) {
            const updatedProduct = { ...existingProduct, ...req.body, updatedAt: getCurrentDate()};
            productsStorage.insert(productId, updatedProduct);
            res.json(updatedProduct);
        } else {
            res.status(404).send(`Product with id=${productId} not found`);
        }
    } catch (error) {
        res.status(400).send(`Invalid product data: ${error.message}`);
    }
});

// Route to delete a product by ID
app.delete("/products/:id", (req, res) => {
    const productId = req.params.id;
    const deletedProduct = productsStorage.remove(productId);
    if (deletedProduct) {
        res.json(deletedProduct);
    } else {
        res.status(404).send(`Product with id=${productId} not found`);
    }
});

const server = Server(() => {
    return app.listen();
});

// Function to get current date
function getCurrentDate() {
    return new Date(ic.time().toString());
}

export default server;
