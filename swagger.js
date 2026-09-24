// Generates swagger.json using swagger-autogen.
// Scans the route definitions in ./routes/index.js and writes the resulting
// OpenAPI 2.0 document to ./swagger.json (served at /api-docs).

require('dotenv').config();

const swaggerAutogen = require('swagger-autogen')();

// API-level metadata used in the generated documentation.
const doc = {
  info: {
    title: 'ArtCatalog API',
    description: 'CSE 341 Final Project - Art Catalog REST API',
    version: '1.0.0',
  },
  host: `localhost:${process.env.PORT || 3000}`,
  basePath: '/api',
  schemes: ['http'],
};

// Where to write the document and which route modules to scan.
const outputFile = './swagger.json';
const endpointsFiles = ['./routes/index.js'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('swagger.json generated');
});