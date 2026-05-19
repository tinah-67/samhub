const path = require("path");
const cors = require("cors");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const authRoutes = require("./routes/auth");
const inquiryRoutes = require("./routes/inquiries");
const listingRoutes = require("./routes/listings");
const staffRoutes = require("./routes/staff");
const { router: uploadRoutes, uploadRoot } = require("./routes/uploads");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
    credentials: true,
  })
);
app.use(express.json({ limit: "12mb" }));
app.use("/uploads", express.static(uploadRoot));

app.get("/", (req, res) => {
  res.json({
    name: "Samhub Creations API",
    status: "running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/uploads", uploadRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((error, req, res, next) => {
  const status = error.status || 500;

  if (error.code === "P2002") {
    return res.status(409).json({ message: "A record with this value already exists" });
  }

  if (error.code === "P2025") {
    return res.status(404).json({ message: "Record not found" });
  }

  console.error(error);

  return res.status(status).json({
    message: status === 500 ? "Something went wrong" : error.message,
  });
});

app.listen(PORT, () => {
  console.log(`Samhub Creations API running on port ${PORT}`);
});
