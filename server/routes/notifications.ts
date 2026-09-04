import { Router } from 'express';

const router = Router();

interface SendNotificationDto {
    title: string;
    body: string;
}

const EXTERNAL_API_URL = 'https://navodaya-clap-iyo66dld7q-ew.a.run.app/navodaya-clap/notify';

router.post('/send', async (req, res) => {
    try {
        const { title, body } = req.body as SendNotificationDto;

        // Validate input
        if (!title || typeof title !== 'string' || title.trim() === '') {
            return res.status(400).json({
                error: 'Title is required and must be a non-empty string',
            });
        }

        if (!body || typeof body !== 'string' || body.trim() === '') {
            return res.status(400).json({
                error: 'Body is required and must be a non-empty string',
            });
        }

        // Call external notification API
        const response = await fetch(EXTERNAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title.trim(),
                body: body.trim(),
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`External API error: ${response.status}`, errorData);

            return res.status(502).json({
                error: `Failed to send notification. External service returned ${response.status}`,
            });
        }

        const data = await response.json();

        res.json({
            success: true,
            message: 'Notification sent successfully to all users',
            data,
        });
    } catch (err) {
        console.error('Notification error:', err);

        if (err instanceof Error) {
            // Network errors, timeout, etc.
            if (err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
                return res.status(503).json({
                    error: 'External notification service is unavailable',
                });
            }

            return res.status(500).json({
                error: `Error processing notification: ${err.message}`,
            });
        }

        res.status(500).json({
            error: 'An unexpected error occurred while processing the notification',
        });
    }
});

export default router;
