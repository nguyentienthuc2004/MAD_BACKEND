import swaggerJSDoc from "swagger-jsdoc";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Social Media API",
      version: "1.0.0",
      description: "Social Media API with JWT Authentication",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT access token",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            username: {
              type: "string",
              example: "johndoe",
            },
            email: {
              type: "string",
              example: "john@example.com",
            },
            displayName: {
              type: "string",
              example: "John Doe",
            },
            role: {
              type: "string",
              enum: ["user", "admin"],
              example: "user",
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "banned"],
              example: "active",
            },
            isVerified: {
              type: "boolean",
              example: false,
            },
            bio: {
              type: "string",
              example: "Hello, I am John!",
            },
            avatarUrl: {
              type: "string",
              example: "https://example.com/avatar.jpg",
            },
            isOnline: {
              type: "boolean",
              example: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;
