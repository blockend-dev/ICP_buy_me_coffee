// Import necessary libraries
import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express from 'express';

// Define the structure for a staking entry
class StakingEntry {
   id: string;
   stakerAddress: string;
   amount: number;
   currency: string;
   createdAt: Date;
}

// Create a stable BTree map to store staking entries
const stakingEntriesStorage = StableBTreeMap<string, StakingEntry>(0);

export default Server(() => {
   const app = express();
   app.use(express.json());

   // Endpoint to allow users to create new staking entries
   app.post("/staking", (req, res) => {
      const stakingEntry: StakingEntry = {
         id: uuidv4(),
         createdAt: getCurrentDate(),
         ...req.body
      };
      stakingEntriesStorage.insert(stakingEntry.id, stakingEntry);
      res.json(stakingEntry);
   });

   // Endpoint to retrieve all staking entries
   app.get("/staking", (req, res) => {
      res.json(stakingEntriesStorage.values());
   });

   // Endpoint to retrieve a specific staking entry by its ID
   app.get("/staking/:id", (req, res) => {
      const stakingEntryId = req.params.id;
      const stakingEntryOpt = stakingEntriesStorage.get(stakingEntryId);
      if ("None" in stakingEntryOpt) {
         res.status(404).send(`Staking entry with id=${stakingEntryId} not found`);
      } else {
         res.json(stakingEntryOpt.Some);
      }
   });

   // Endpoint to update a specific staking entry
   app.put("/staking/:id", (req, res) => {
      const stakingEntryId = req.params.id;
      const stakingEntryOpt = stakingEntriesStorage.get(stakingEntryId);
      if ("None" in stakingEntryOpt) {
         res.status(400).send(`Unable to update staking entry with id=${stakingEntryId}. Entry not found`);
      } else {
         const stakingEntry = stakingEntryOpt.Some;
         const updatedStakingEntry = { ...stakingEntry, ...req.body };
         stakingEntriesStorage.insert(stakingEntry.id, updatedStakingEntry);
         res.json(updatedStakingEntry);
      }
   });

   // Endpoint to delete a specific staking entry
   app.delete("/staking/:id", (req, res) => {
      const stakingEntryId = req.params.id;
      const deletedStakingEntry = stakingEntriesStorage.remove(stakingEntryId);
      if ("None" in deletedStakingEntry) {
         res.status(400).send(`Unable to delete staking entry with id=${stakingEntryId}. Entry not found`);
      } else {
         res.json(deletedStakingEntry.Some);
      }
   });

   // Start the server and listen for incoming requests
   return app.listen();
});

// Function to get the current date
function getCurrentDate() {
   const timestamp = new Number(ic.time());
   return new Date(timestamp.valueOf() / 1000_000);
}