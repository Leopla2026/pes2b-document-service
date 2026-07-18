const express = require('express');
const config = require('../config/app.config');
const parserRegistry = require('../document/parsers/registry');
const metrics = require('../metrics/operational-metrics');
const { ENGINE_VERSION } = require('../document/engine/engine.response');

const router = express.Router();

router.get('/', (req, res) => {
  const data = metrics.snapshot({
    engineVersion: ENGINE_VERSION,
    parserDefinitions: parserRegistry.list()
  });

  res.status(200).json({
    success: true,
    message: 'Diagnóstico operacional do serviço.',
    requestId: req.requestId,
    data: {
      service: config.serviceName,
      environment: config.environment,
      ...data
    },
    errors: [],
    warnings: [
      'As métricas são mantidas em memória e reiniciadas quando o serviço é reiniciado.'
    ]
  });
});

module.exports = router;
