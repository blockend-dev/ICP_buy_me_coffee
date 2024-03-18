import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

/**
 * `horoscopeStorage` - a key-value data structure used to store horoscopes.
 * {@link StableBTreeMap} is used for durable storage across canister upgrades.
 */
class Horoscope {
   id: string;
   sign: string; // Zodiac sign
   prediction: string; // Horoscope prediction
   createdAt: Date;
   updatedAt: Date | null;
}

const horoscopeStorage = StableBTreeMap<string, Horoscope>(0);

export default Server(() => {
   const app = express();
   app.use(express.json());

   // Endpoint to create a new horoscope
   app.post("/horoscopes", (req, res) => {
      const horoscope: Horoscope =  {id: uuidv4(), createdAt: getCurrentDate(), ...req.body};
      horoscopeStorage.insert(horoscope.id, horoscope);
      res.json(horoscope);
   });

   // Endpoint to fetch all horoscopes
   app.get("/horoscopes", (req, res) => {
      res.json(horoscopeStorage.values());
   });

   // Endpoint to fetch a specific horoscope by ID
   app.get("/horoscopes/:id", (req, res) => {
      const horoscopeId = req.params.id;
      const horoscopeOpt = horoscopeStorage.get(horoscopeId);
      if ("None" in horoscopeOpt) {
         res.status(404).send(`Horoscope with id=${horoscopeId} not found`);
      } else {
         res.json(horoscopeOpt.Some);
      }
   });

   // Endpoint to update a horoscope
   app.put("/horoscopes/:id", (req, res) => {
      const horoscopeId = req.params.id;
      const horoscopeOpt = horoscopeStorage.get(horoscopeId);
      if ("None" in horoscopeOpt) {
         res.status(400).send(`Couldn't update horoscope with id=${horoscopeId}. Horoscope not found`);
      } else {
         const horoscope = horoscopeOpt.Some;
         const updatedHoroscope = { ...horoscope, ...req.body, updatedAt: getCurrentDate()};
         horoscopeStorage.insert(horoscope.id, updatedHoroscope);
         res.json(updatedHoroscope);
      }
   });

   // Endpoint to delete a horoscope
   app.delete("/horoscopes/:id", (req, res) => {
      const horoscopeId = req.params.id;
      const deletedHoroscope = horoscopeStorage.remove(horoscopeId);
      if ("None" in deletedHoroscope) {
         res.status(400).send(`Couldn't delete horoscope with id=${horoscopeId}. Horoscope not found`);
      } else {
         res.json(deletedHoroscope.Some);
      }
   });

   return app.listen();
});

function getCurrentDate() {
   const timestamp = new Number(ic.time());
   return new Date(timestamp.valueOf() / 1000_000);
}
