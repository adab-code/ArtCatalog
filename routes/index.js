// Central router.

const express = require("express");
const router = express.Router();

// Swagger UI mount path integration at /api-docs.
router.use("/api-docs", require("./swagger"));

// ---- Core Application Service Component Clusters ----
// All GitHub OAuth endpoints are cleanly managed and isolated inside routes/auth.js
router.use("/api/auth", require("./auth"));

// Entity catalog operational collection pathways
router.use("/api/artists", require("./artists"));
router.use("/api/artworks", require("./artworks"));
router.use("/api/keywords", require("./keywords"));
router.use("/api/artworkKeywords", require("./artworkKeywords"));
router.use("/api/users", require("./users"));

module.exports = router;
