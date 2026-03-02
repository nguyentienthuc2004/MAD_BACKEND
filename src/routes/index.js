import userRoutes from "./user.route.js";
import authRoutes from "./auth.route.js";

const routes = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
};

export default routes;
