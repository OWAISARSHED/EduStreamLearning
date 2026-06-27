const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EduStream API',
      version: '1.0.0',
      description: 'AI-Assisted Learning & Multilingual Mentor Ecosystem API',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development server' },
    ],
    tags: [
      { name: 'Authentication', description: 'User registration, login, password reset' },
      { name: 'AI', description: 'AI translation, summarization, tag suggestions' },
      { name: 'Forum', description: 'Discussion threads and replies' },
      { name: 'Resources', description: 'Document repository management' },
      { name: 'Users', description: 'User management and admin operations' },
      { name: 'Notifications', description: 'User notification center' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'],
};

module.exports = swaggerJsdoc(options);
