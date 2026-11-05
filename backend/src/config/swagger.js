import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SweetCode API',
      version: '1.0.0',
      description: 'API REST de la pastelería SweetCode — PFC DAW',
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Desarrollo' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
  },
  apis: ['./src/routes/*.js'], // donde lee los comentarios
};

export default swaggerJsdoc(options);