import express from 'express';
import path from 'path';

import notificationRoutes from './routes/notifications';

const app = express();

app.use(express.json());

app.use('/api/notifications', notificationRoutes);

const navodayaClapApiUrl = process.env.NAVODAYA_CLAP_API_URL
    || 'http://localhost:8080';

app.use(['/navodaya-clap/admin', '/navodaya-clap/auth'], async (req, res) => {
    try {
        const upstreamUrl = new URL(req.originalUrl, `${navodayaClapApiUrl}/`);
        const headers = new Headers();
        const authorization = req.get('authorization');
        if (authorization) headers.set('authorization', authorization);
        if (req.body && Object.keys(req.body).length > 0) {
            headers.set('content-type', 'application/json');
        }

        const upstreamResponse = await fetch(upstreamUrl, {
            method: req.method,
            headers,
            body: req.method === 'GET' || req.method === 'HEAD'
                ? undefined
                : JSON.stringify(req.body ?? {}),
        });

        res.status(upstreamResponse.status);
        const contentType = upstreamResponse.headers.get('content-type');
        if (contentType) res.set('content-type', contentType);
        const responseBody = await upstreamResponse.text();
        if (responseBody) res.send(responseBody);
        else res.end();
    } catch (error) {
        console.error('Navodaya Clap API proxy failed:', error);
        res.status(502).json({ error: 'Service is currently unavailable' });
    }
});

const clientPath = path.join(
    process.cwd(),
    'client/dist'
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