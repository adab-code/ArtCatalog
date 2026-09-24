// Serves the generated OpenAPI document (swagger.json) through Swagger UI.
// The document is (re)generated with `npm run genSwagger`.

const router = require('express').Router();
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger.json');

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerDocument));

module.exports = router;