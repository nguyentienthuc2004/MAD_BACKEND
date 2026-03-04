import userRoutes from "./user.route.js";
import authRoutes from "./auth.route.js";
import postRoutes from "./post.route.js";
import likeRoutes from "./like.route.js";
import commentRoutes from "./comment.route.js";
import notificationRoutes from "./notification.route.js";
import chatRoutes from "./chat.route.js";
import { authenticate } from "../middleware/auth.middleware.js";

const routes = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/posts", authenticate, postRoutes);
  app.use("/api", likeRoutes);
  app.use("/api", commentRoutes);
  app.use("/api/notifications", notificationRoutes);

};

export default routes;
