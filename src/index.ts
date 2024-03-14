import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

/**
 * `donationsStorage` - it's a key-value datastructure that is used to store donations.
 * {@link StableBTreeMap} is a self-balancing tree that acts as a durable data storage that keeps data across canister upgrades.
 * For the sake of this contract we've chosen {@link StableBTreeMap} as a storage for the next reasons:
 * - `insert`, `get` and `remove` operations have a constant time complexity - O(1)
 * - data stored in the map survives canister upgrades unlike using HashMap where data is stored in the heap and it's lost after the canister is upgraded
 *
 * Brakedown of the `StableBTreeMap(string, Donation)` datastructure:
 * - the key of map is a `donationId`
 * - the value in this map is a donation itself `Donation` that is related to a given key (`donationId`)
 *
 * Constructor values:
 * 1) 0 - memory id where to initialize a map.
 */

/**
 This type represents a donation.
 */
class Donation {
   id: string;
   amount: number;
   donorName: string;
   message: string;
   createdAt: Date;
}

const donationsStorage = StableBTreeMap<string, Donation>(0);

export default Server(() => {
   const app = express();
   app.use(express.json());

   app.post("/donations", (req, res) => {
      const donation: Donation =  {id: uuidv4(), createdAt: getCurrentDate(), ...req.body};
      donationsStorage.insert(donation.id, donation);
      res.json(donation);
   });

   app.get("/donations", (req, res) => {
      res.json(donationsStorage.values());
   });

   app.get("/donations/:id", (req, res) => {
      const donationId = req.params.id;
      const donationOpt = donationsStorage.get(donationId);
      if ("None" in donationOpt) {
         res.status(404).send(`the donation with id=${donationId} not found`);
      } else {
         res.json(donationOpt.Some);
      }
   });

   return app.listen();
});

function getCurrentDate() {
   const timestamp = new Number(ic.time());
   return new Date(timestamp.valueOf() / 1000_000);
}