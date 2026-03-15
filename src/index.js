import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
import dotenv from "dotenv"
dotenv.config()
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log("MONGO_URI:", process.env.MONGO_URI);
await connectDB();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Social Media API is running",
    docs: `http://localhost:${PORT}/api-docs`,
  });
});

routes(app);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
});
