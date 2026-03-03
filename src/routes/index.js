import userRoutes from "./user.route.js";
import authRoutes from "./auth.route.js";
import chatRoutes from "./chat.route.js";

const routes = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/chat", chatRoutes);
};

export default routes;
