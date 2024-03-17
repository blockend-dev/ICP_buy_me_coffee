// Import necessary modules
import { v4 as uuidv4 } from 'uuid';
import { Server, StableBTreeMap, ic } from 'azle';
import express, { Request, Response, NextFunction } from 'express';

/**
 * This type represents a skill record in the blockchain.
 */
interface SkillRecord {
    id: string;
    skill: string;
    owner: string; // Representing the owner's identifier (e.g., user ID)
    verified: boolean;
    verifier: string; // Representing the verifier's identifier (e.g., organization ID)
    createdAt: Date;
    updatedAt: Date | null;
}

// Initialize the storage for skill records
const skillRecordsStorage = StableBTreeMap<string, SkillRecord>(0);

// Initialize the express application
export default Server(() => {
    const app = express();
    app.use(express.json());

    // Middleware to handle errors
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
        console.error(err.stack);
        res.status(500).send('Internal Server Error');
    });

    // Endpoint to add a new skill record to the blockchain
    app.post("/skill-records", (req: Request, res: Response) => {
        try {
            // Validate request body
            const { skill, owner }: Partial<SkillRecord> = req.body;
            if (!skill || !owner) {
                return res.status(400).send('Invalid skill record data');
            }

            // Create new skill record object
            const skillRecord: SkillRecord = {
                id: uuidv4(),
                createdAt: getCurrentDate(),
                verified: false,
                verifier: "",
                ...req.body
            };

            // Insert skill record into storage
            skillRecordsStorage.insert(skillRecord.id, skillRecord);

            // Send response
            res.json(skillRecord);
        } catch (error) {
            next(error);
        }
    });

   // Endpoint to get all skill records from the blockchain
    app.get("/skill-records", (req, res) => {
        res.json(skillRecordsStorage.values());
    });

    // Endpoint to get a specific skill record by ID
    app.get("/skill-records/:id", (req, res) => {
        const skillRecordId = req.params.id;
        const skillRecordOpt = skillRecordsStorage.get(skillRecordId);
        if ("None" in skillRecordOpt) {
            res.status(404).send(`Skill record with id=${skillRecordId} not found`);
        } else {
            res.json(skillRecordOpt.Some);
        }
    });

    // Endpoint to update a skill record (e.g., to verify or modify skills)
    app.put("/skill-records/:id", (req, res) => {
        const skillRecordId = req.params.id;
        const skillRecordOpt = skillRecordsStorage.get(skillRecordId);
        if ("None" in skillRecordOpt) {
            res.status(400).send(`Couldn't update skill record with id=${skillRecordId}. Record not found`);
        } else {
            const skillRecord = skillRecordOpt.Some;
            const updatedSkillRecord = {
                ...skillRecord,
                ...req.body,
                updatedAt: getCurrentDate()
            };
            skillRecordsStorage.insert(skillRecord.id, updatedSkillRecord);
            res.json(updatedSkillRecord);
        }
    });

    // Endpoint to delete a skill record from the blockchain
    app.delete("/skill-records/:id", (req, res) => {
        const skillRecordId = req.params.id;
        const deletedSkillRecord = skillRecordsStorage.remove(skillRecordId);
        if ("None" in deletedSkillRecord) {
            res.status(400).send(`Couldn't delete skill record with id=${skillRecordId}. Record not found`);
        } else {
            res.json(deletedSkillRecord.Some);
        }
    });

    return app.listen();
}); // End of Server function

// Function to get the current date
function getCurrentDate() {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
}
