import express from 'express';
import { Server, StableBTreeMap, ic } from 'azle';
import { v4 as uuidv4 } from 'uuid';

interface Horoscope {
    id: string;
    sign: string;
    prediction: string;
    createdAt: Date;
    updatedAt: Date | null;
}

const horoscopeStorage = StableBTreeMap<string, Horoscope>(0);

export default Server(() => {
    const app = express();
    app.use(express.json());

    // Middleware for error handling
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
        console.error(err.stack);
        res.status(500).send('Internal Server Error');
    });

    // Endpoint to create a new horoscope
    app.post('/horoscopes', (req, res) => {
        try {
            const { sign, prediction } = req.body;

            // Input validation
            if (!sign || !prediction) {
                throw new Error('Sign and prediction are required fields.');
            }

            const existingHoroscope = horoscopeStorage.values().find(h => h.sign === sign);
            if (existingHoroscope) {
                throw new Error('Horoscope already exists for this sign.');
            }

            const horoscope: Horoscope = {
                id: uuidv4(),
                sign,
                prediction,
                createdAt: getCurrentDate(),
                updatedAt: null,
            };
            horoscopeStorage.insert(horoscope.id, horoscope);
            res.json(horoscope);
        } catch (error) {
            next(error);
        }
    });

    // Endpoint to fetch all horoscopes
    app.get('/horoscopes', (req, res) => {
        res.json(horoscopeStorage.values());
    });

    // Endpoint to fetch a specific horoscope by ID
    app.get('/horoscopes/:id', (req, res) => {
        try {
            const horoscopeId = req.params.id;
            const horoscopeOpt = horoscopeStorage.get(horoscopeId);
            if ('None' in horoscopeOpt) {
                res.status(404).send(`Horoscope with id=${horoscopeId} not found.`);
            } else {
                res.json(horoscopeOpt.Some);
            }
        } catch (error) {
            next(error);
        }
    });

    // Endpoint to update a horoscope
    app.put('/horoscopes/:id', (req, res) => {
        try {
            const horoscopeId = req.params.id;
            const { sign, prediction } = req.body;
            const horoscopeOpt = horoscopeStorage.get(horoscopeId);
            if ('None' in horoscopeOpt) {
                res.status(404).send(`Horoscope with id=${horoscopeId} not found.`);
            } else {
                const existingHoroscope = horoscopeStorage.values().find(h => h.sign === sign && h.id !== horoscopeId);
                if (existingHoroscope) {
                    throw new Error('Horoscope already exists for this sign.');
                }

                const horoscope = horoscopeOpt.Some;
                horoscope.sign = sign || horoscope.sign;
                horoscope.prediction = prediction || horoscope.prediction;
                horoscope.updatedAt = getCurrentDate();
                horoscopeStorage.insert(horoscope.id, horoscope);
                res.json(horoscope);
            }
        } catch (error) {
            next(error);
        }
    });

    // Endpoint to delete a horoscope
    app.delete('/horoscopes/:id', (req, res) => {
        try {
            const horoscopeId = req.params.id;
            const deletedHoroscope = horoscopeStorage.remove(horoscopeId);
            if ('None' in deletedHoroscope) {
                res.status(404).send(`Horoscope with id=${horoscopeId} not found.`);
            } else {
                res.json(deletedHoroscope.Some);
            }
        } catch (error) {
            next(error);
        }
    });

    return app.listen();
});

function getCurrentDate() {
    const timestamp = new Number(ic.time());
    return new Date(timestamp.valueOf() / 1000_000);
}
