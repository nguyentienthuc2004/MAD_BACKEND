import userRoutes from "./user.route.js";
import authRoutes from "./auth.route.js";
import postRoutes from "./post.route.js";
import chatRoutes from "./chat.route.js";
import { authenticate } from "../middleware/auth.middleware.js";

const routes = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/posts", authenticate, postRoutes);

};

export default routes;
