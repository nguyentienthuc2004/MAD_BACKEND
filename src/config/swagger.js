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
        PostCreateRequest: {
          type: "object",
          properties: {
            caption: {
              type: "string",
              example: "Outfit of the day",
            },
            hashtags: {
              description:
                "Array of hashtag strings. For multipart/form-data, you can send repeated fields (hashtags=fashion&hashtags=ootd) or a JSON/comma-separated string",
              oneOf: [
                {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: ["fashion", "ootd"],
                },
                {
                  type: "string",
                  example: '["fashion","ootd"]',
                },
                {
                  type: "string",
                  example: "fashion,ootd",
                },
              ],
            },
            musicId: {
              type: "string",
              nullable: true,
              example: "65f123abc456def789012345",
            },
            images: {
              type: "array",
              description: "Up to 10 image files",
              items: {
                type: "string",
                format: "binary",
              },
            },
          },
        },
        PostEditRequest: {
          type: "object",
          properties: {
            caption: {
              type: "string",
              example: "Updated caption",
            },
            hashtags: {
              description:
                "Array of hashtag strings. For multipart/form-data, you can send repeated fields (hashtags=fashion&hashtags=ootd) or a JSON/comma-separated string",
              oneOf: [
                {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: ["fashion", "ootd"],
                },
                {
                  type: "string",
                  example: '["fashion","ootd"]',
                },
                {
                  type: "string",
                  example: "fashion,ootd",
                },
              ],
            },
            musicId: {
              type: "string",
              nullable: true,
              description: "Set null to remove music",
              example: "65f123abc456def789012345",
            },
            existingImages: {
              description:
                "Old image URLs to keep. Send as JSON array string, comma-separated string, or repeated field",
              oneOf: [
                {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  example: [
                    "https://res.cloudinary.com/demo/image/upload/v1/old-1.jpg",
                    "https://res.cloudinary.com/demo/image/upload/v1/old-2.jpg",
                  ],
                },
                {
                  type: "string",
                  example:
                    '["https://res.cloudinary.com/demo/image/upload/v1/old-1.jpg"]',
                },
                {
                  type: "string",
                  example:
                    "https://res.cloudinary.com/demo/image/upload/v1/old-1.jpg,https://res.cloudinary.com/demo/image/upload/v1/old-2.jpg",
                },
              ],
            },
            images: {
              type: "array",
              description: "New image files to add (up to 10 total after merge)",
              items: {
                type: "string",
                format: "binary",
              },
            },
          },
        },
        Post: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              example: "67c4f1b2c3d4e5f678901234",
            },
            userId: {
              type: "string",
              example: "507f1f77bcf86cd799439011",
            },
            caption: {
              type: "string",
              example: "Outfit of the day",
            },
            hashtags: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["fashion", "ootd"],
            },
            images: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
            },
            musicId: {
              type: "string",
              nullable: true,
              example: "65f123abc456def789012345",
            },
            isDeleted: {
              type: "boolean",
              example: false,
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
        CreatePostResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Post created successfully",
            },
            data: {
              $ref: "#/components/schemas/Post",
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
