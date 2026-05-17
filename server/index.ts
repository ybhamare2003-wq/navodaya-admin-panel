import express from 'express';
import path from 'path';

import userRoutes from './routes/users';
import businessRoutes from './routes/businesses';

const app = express();

app.use(express.json());

app.use('/api/users', userRoutes);

app.use('/api/businesses', businessRoutes);

const clientPath = path.join(
    __dirname,
    '../client/dist'
);

app.use(express.static(clientPath));

app.get(/.*/, (_, res) => {
    res.sendFile(
        path.join(clientPath, 'index.html')
    );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});