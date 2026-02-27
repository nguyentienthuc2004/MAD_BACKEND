import userRoutes from "./user.route.js";

const routes = (app) => {
  app.use("/api/users", userRoutes);
};

export default routes;
