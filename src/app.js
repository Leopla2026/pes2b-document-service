const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const healthRoutes = require('./routes/health.routes');
const infoRoutes = require('./routes/info.routes');
const openApiRoutes = require('./routes/openapi.routes');
const pdfRoutes = require('./routes/pdf.routes');
const requestIdMiddleware = require('./middleware/request-id.middleware');
const requestObservabilityMiddleware = require('./middleware/request-observability.middleware');
const apiKeyMiddleware = require('./middleware/api-key.middleware');
const notFoundMiddleware = require('./middleware/not-found.middleware');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(requestIdMiddleware);
app.use(requestObservabilityMiddleware);

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/info', infoRoutes);
app.use('/openapi.json', openApiRoutes);

app.use('/api/v1/pdf', apiKeyMiddleware, pdfRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
