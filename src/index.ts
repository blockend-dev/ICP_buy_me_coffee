import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express, { Request, Response } from 'express';

// Define the structure for a staking entry
interface StakingEntry {
   id: string;
   stakerAddress: string;
   amount: number;
   currency: string;
   createdAt: Date;
}

// Create a stable BTree map to store staking entries
const stakingEntriesStorage = StableBTreeMap<string, StakingEntry>(0);

const app = express();
app.use(express.json());

// Endpoint to allow users to create new staking entries
app.post("/staking", (req: Request, res: Response) => {
    try {
        const { stakerAddress, amount, currency }: StakingEntry = req.body;
        if (!stakerAddress || !amount || !currency) {
            throw new Error('Missing required fields in the staking entry object');
        }
        const stakingEntry: StakingEntry = {
            id: uuidv4(),
            createdAt: getCurrentDate(),
            stakerAddress,
            amount,
            currency
        };
        stakingEntriesStorage.insert(stakingEntry.id, stakingEntry);
        res.json(stakingEntry);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Endpoint to retrieve all staking entries
app.get("/staking", (req: Request, res: Response) => {
    res.json(stakingEntriesStorage.values());
});

// Endpoint to retrieve a specific staking entry by its ID
app.get("/staking/:id", (req: Request, res: Response) => {
    const stakingEntryId = req.params.id;
    const stakingEntryOpt = stakingEntriesStorage.get(stakingEntryId);
    if ("None" in stakingEntryOpt) {
        res.status(404).send(`Staking entry with id=${stakingEntryId} not found`);
    } else {
        res.json(stakingEntryOpt.Some);
    }
});

// Endpoint to update a specific staking entry
app.put("/staking/:id", (req: Request, res: Response) => {
    try {
        const stakingEntryId = req.params.id;
        const { stakerAddress, amount, currency }: StakingEntry = req.body;
        if (!stakerAddress || !amount || !currency) {
            throw new Error('Missing required fields in the staking entry object');
        }
        const stakingEntryOpt = stakingEntriesStorage.get(stakingEntryId);
        if ("None" in stakingEntryOpt) {
            throw new Error(`Unable to update staking entry with id=${stakingEntryId}. Entry not found`);
        }
        const stakingEntry: StakingEntry = {
            ...stakingEntryOpt.Some,
            stakerAddress,
            amount,
            currency
        };
        stakingEntriesStorage.insert(stakingEntry.id, stakingEntry);
        res.json(stakingEntry);
    } catch (error) {
        res.status(400).send(error.message);
    }
});

// Endpoint to delete a specific staking entry
app.delete("/staking/:id", (req: Request, res: Response) => {
    const stakingEntryId = req.params.id;
    const deletedStakingEntry = stakingEntriesStorage.remove(stakingEntryId);
    if ("None" in deletedStakingEntry) {
        res.status(400).send(`Unable to delete staking entry with id=${stakingEntryId}. Entry not found`);
    } else {
        res.json(deletedStakingEntry.Some);
    }
});

// Start the server and listen for incoming requests
export default Server(() => app.listen());

// Function to get the current date
function getCurrentDate(): Date {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
}
