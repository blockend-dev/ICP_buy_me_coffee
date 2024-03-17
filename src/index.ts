// Import required modules
import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express, { Request, Response, NextFunction } from 'express';


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


// Define Donation interface
interface Donation {
   id: string;
   amount: number;
   donorName: string;
   message: string;
   createdAt: Date;
}

// Initialize donations storage
const donationsStorage = StableBTreeMap<string, Donation>(0);

// Create Express app
const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
   console.error(err.stack);
   res.status(500).send('Internal Server Error');
});

// POST endpoint to add a new donation
app.post("/donations", (req: Request, res: Response) => {
   try {
      // Validate request body
      const { amount, donorName, message }: Partial<Donation> = req.body;
      if (!amount || !donorName || !message) {
         return res.status(400).send('Invalid donation data');
      }

      // Create new donation object
      const donation: Donation = {
         id: uuidv4(),
         createdAt: getCurrentDate(),
         amount,
         donorName,
         message
      };

      // Insert donation into storage
      donationsStorage.insert(donation.id, donation);

      // Send response
      res.json(donation);
   } catch (error) {
      next(error);
   }
});

// GET endpoint to retrieve all donations
app.get("/donations", (req: Request, res: Response) => {
   try {
      res.json(donationsStorage.values());
   } catch (error) {
      next(error);
   }
});

// GET endpoint to retrieve a specific donation by ID
app.get("/donations/:id", (req: Request, res: Response) => {
   try {
      const donationId = req.params.id;
      const donationOpt = donationsStorage.get(donationId);
      if ("None" in donationOpt) {
         return res.status(404).send(`Donation with id=${donationId} not found`);
      }
      res.json(donationOpt.Some);
   } catch (error) {
      next(error);
   }
});

// Helper function to get current date
function getCurrentDate() {
   const timestamp = new Number(ic.time());
   return new Date(timestamp.valueOf() / 1000_000);
}

// Export Express app
export default Server(() => {
   return app.listen();
});
