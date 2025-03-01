import app from "./app.js";
import sequelize from "./config/database.js";
import { initializeAdminUser } from "./services/authService.js";

const PORT = process.env.PORT || 6005;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected!");

    await sequelize.sync({ alter: false });
    console.log("Database synchronized!");

    await initializeAdminUser();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();
