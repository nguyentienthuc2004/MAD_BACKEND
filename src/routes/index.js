import userRoutes from "./user.route.js";
import authRoutes from "./auth.route.js";
import postRoutes from "./post.route.js";
import likeRoutes from "./like.route.js";
import commentRoutes from "./comment.route.js";
import notificationRoutes from "./notification.route.js";
import chatRoutes from "./chat.route.js";
import searchRoutes from "./search.route.js";
import followRoutes from "./follow.route.js";
import musicRoutes from "./music.route.js";
import userActivityRoutes from "./userActivity.route.js";
import { authenticate } from "../middleware/auth.middleware.js";

const routes = (app) => {
  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/chat", authenticate, chatRoutes);
  app.use("/api/posts", authenticate, postRoutes);
  app.use("/api", likeRoutes);
  app.use("/api", commentRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/follow", followRoutes);
  app.use("/api/musics", authenticate, musicRoutes);
  app.use("/api/activities", userActivityRoutes);
};

export default routes;
