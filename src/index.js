import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import userRoutes from "./routes/user.route.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(express.json());
await connectDB();

// routes
app.get("/", (req, res) => {
  res.send("🚀 API running (gộp index + app)");
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// user routes
app.use("/api/users", userRoutes);

// start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
