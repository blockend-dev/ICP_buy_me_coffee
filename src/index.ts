import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

class Product {
   id: string;
   name: string;
   description: string;
   price: number;
   imageURL: string;
   createdAt: Date;
   updatedAt: Date | null;
}

const productsStorage = StableBTreeMap<string, Product>(0);

export default Server(() => {
   const app = express();
   app.use(express.json());

   app.post("/products", (req, res) => {
      const product: Product =  {id: uuidv4(), createdAt: getCurrentDate(), ...req.body};
      productsStorage.insert(product.id, product);
      res.json(product);
   });

   app.get("/products", (req, res) => {
      res.json(productsStorage.values());
   });

   app.get("/products/:id", (req, res) => {
      const productId = req.params.id;
      const productOpt = productsStorage.get(productId);
      if ("None" in productOpt) {
         res.status(404).send(`The product with id=${productId} was not found`);
      } else {
         res.json(productOpt.Some);
      }
   });

   app.put("/products/:id", (req, res) => {
      const productId = req.params.id;
      const productOpt = productsStorage.get(productId);
      if ("None" in productOpt) {
         res.status(400).send(`Couldn't update product with id=${productId}. Product not found`);
      } else {
         const product = productOpt.Some;
         const updatedProduct = { ...product, ...req.body, updatedAt: getCurrentDate()};
         productsStorage.insert(product.id, updatedProduct);
         res.json(updatedProduct);
      }
   });

   app.delete("/products/:id", (req, res) => {
      const productId = req.params.id;
      const deletedProduct = productsStorage.remove(productId);
      if ("None" in deletedProduct) {
         res.status(400).send(`Couldn't delete product with id=${productId}. Product not found`);
      } else {
         res.json(deletedProduct.Some);
      }
   });

   return app.listen();
});

function getCurrentDate() {
   const timestamp = new Number(ic.time());
   return new Date(timestamp.valueOf() / 1000_000);
}
