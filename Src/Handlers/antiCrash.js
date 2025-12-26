function loadAntiCrash(client) {
  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason, promise) => {
    console.error("[AntiCrash] Unhandled Rejection:", reason);
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    console.error("[AntiCrash] Uncaught Exception:", error);
  });

  // Optional: handle warnings
  process.on("warning", (warning) => {
    console.warn("[AntiCrash] Warning:", warning.name, warning.message);
  });

  // You can also catch Discord client errors
  if (client) {
    client.on("error", (error) => {
      console.error("[Discord Client Error]", error);
    });

    client.on("shardError", (error) => {
      console.error("[Discord Shard Error]", error);
    });
  }
}

module.exports = { loadAntiCrash };
