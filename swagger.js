// Generates swagger.json using swagger-autogen.
// Scans the route definitions in ./routes/index.js and writes the resulting
// OpenAPI 3.0 document to ./swagger.json (served at /api-docs), after a small
// cleanup pass (see cleanDoc) because swagger-autogen does not generate
// everything correctly out of the box.

require("dotenv").config();

const fs = require("fs");
// Pass openapi: '3.0.0' to switch generation from legacy Swagger 2.0 to OpenAPI 3.0.
// writeOutputFile:false -> we write the file ourselves after the cleanup.
const swaggerAutogen = require("swagger-autogen")({
  openapi: "3.0.0",
  writeOutputFile: false,
});

// Resources in the order they should appear in Swagger UI. The first segment of
// each path selects the group, so this array doubles as the sort key for paths.
const TAG_ORDER = [
  "auth",
  "artists",
  "artworks",
  "keywords",
  "artworkKeywords",
  "users",
];

// Group name shown in Swagger UI for each resource.
const TAG_NAMES = {
  artists: "Artists",
  artworks: "Artworks",
  keywords: "Keywords",
  artworkKeywords: "Artwork-Keywords",
  users: "Users",
  auth: "Auth",
};

// Order the HTTP methods are listed in inside a path.
const METHOD_ORDER = ["get", "post", "put", "patch", "delete"];

// Build the documentation configuration object dynamically
const doc = {
  openapi: "3.0.0", // Tells the parser to use modern OpenAPI 3.0 features
  info: {
    title: "🎨 ArtCatalog REST API Workspace",
    description:
      "CSE 341 Final Project - Art Catalog REST API under OpenAPI 3.0 specification guidelines.",
    version: "1.0.0",
  },
  // Declaring the tags here is what fixes the group order in Swagger UI
  tags: TAG_ORDER.map((resource) => ({ name: TAG_NAMES[resource] })),

  // OpenAPI 3.0 native multi-server dropdown selector configuration mapping
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Local Development Server",
    },
    {
      url: "https://onrender.com",
      description: "Production Web Server (Render)",
    },
  ],
  // 1. Tell Swagger UI that endpoints require cookie authentication globally
  security: [
    {
      cookieAuth: [],
    },
  ],
  // 2. Define the exact Cookie-based session authentication scheme
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "connect.sid", // Matches the default Express Session cookie identifier
      },
    },
  },
};

// Endpoints that are NOT meant for API consumers: the Swagger UI itself, the
// welcome message, the browser-only GitHub OAuth redirect flow, and the
// development-only dev-login helper.
const REMOVE_PATHS = [
  "/api-docs/",
  "/",
  "/api/auth/github",
  "/api/auth/github/callback",
  "/api/auth/login/failed",
  "/api/auth/dev-login",
];

// Where to write the document and which route modules to scan.
const outputFile = "./swagger.json";
const endpointsFiles = ["./routes/index.js"];

/**
 * Returns the Swagger UI group ("tag") a path belongs to, based on its first
 * segment: "/artists/{id}/artworks" -> "Artists", "/auth/me" -> "Auth".
 */
function tagFor(path) {
  const segment = path.split("/").filter(Boolean)[0] || "default";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

/**
 * Applies small fixes to the auto-generated document:
 * - Dynamically injects the private GITHUB_CLIENT_ID from environmental variables.
 * - The scanned routers already mount under /api, so strip that prefix from
 *   the generated paths. Otherwise Swagger UI would call /api/api/... and every request would 404.
 * - Remove the endpoints listed in REMOVE_PATHS.
 * - Group every operation under a resource tag and sort the paths and the
 *   methods inside them so /api-docs is not one long "default" blob.
 */
function cleanDoc(swaggerDoc) {
  // Fix the OpenAPI 3.0 title box placeholder artifacts dynamically
  const paths = swaggerDoc.paths;
  // Dynamically inject the private GITHUB_CLIENT_ID from environmental variables.
  for (const key of Object.keys(paths)) {
    if (REMOVE_PATHS.includes(key)) {
      delete paths[key];
      continue;
    }
    // "/api/artists/" -> "/artists/" (server URLs array already include "/api").
    if (key.startsWith("/api/")) {
      paths[key.slice(4)] = paths[key];
      delete paths[key];
    }
  }

  // Group routes by entity (Artists, Artworks, Keywords, ArtworkKeywords, Users, Auth...).
  for (const [path, methods] of Object.entries(paths)) {
    const tag = tagFor(path);
    for (const operation of Object.values(methods)) {
      operation.tags = [tag];
    }
  }

  // year is sent as a number by the API (the controller does Number(req.query.year)).
  const artworksGet = paths["/artworks/"] && paths["/artworks/"].get;
  if (artworksGet) {
    const yearParam = artworksGet.parameters.find((p) => p.name === "year");
    if (yearParam) {
      yearParam.type = "integer";
    }
  }

  // A PUT that moves a link onto an already-linked pair is rejected with 409.
  const linkPut =
    paths["/artworkKeywords/{id}"] && paths["/artworkKeywords/{id}"].put;
  if (linkPut && !linkPut.responses["409"]) {
    linkPut.responses["409"] = { description: "Conflict" };
  }

  sortDoc(swaggerDoc);
}

/**
 * Sorts the document for readability, without touching any endpoint data:
 * - Every operation gets the tag of its resource ("/artists/..." -> Artists).
 * - Paths are grouped by TAG_ORDER and sorted segment by segment inside a
 *   group.
 * - Methods inside a path follow METHOD_ORDER (GET, POST, PUT, PATCH, DELETE).
 * - Unknown resources are dropped from the sorted copy.
 */
function sortDoc(swaggerDoc) {
  const sorted = {};

  const paths = Object.keys(swaggerDoc.paths)
    .filter((path) => TAG_NAMES[resourceOf(path)])
    .sort(
      (a, b) =>
        TAG_ORDER.indexOf(resourceOf(a)) - TAG_ORDER.indexOf(resourceOf(b)) ||
        compareSegments(a, b),
    );

  for (const path of paths) {
    const operations = swaggerDoc.paths[path];
    const ordered = {};

    for (const method of METHOD_ORDER) {
      if (!operations[method]) continue;
      operations[method].tags = [TAG_NAMES[resourceOf(path)]];
      ordered[method] = operations[method];
    }
    // Keep anything that is not an operation (e.g. path level "parameters").
    for (const key of Object.keys(operations)) {
      if (!(key in ordered)) ordered[key] = operations[key];
    }

    sorted[path] = ordered;
  }

  swaggerDoc.paths = sorted;
}

// First path segment, i.e. the resource the endpoint belongs to.
function resourceOf(path) {
  return path.split("/")[1];
}

/**
 * Compares two paths segment by segment so the order reads naturally:
 * literal segments ("search") first, templated ones ("{id}") after, and a
 * parent path before its children.
 */
function compareSegments(a, b) {
  const left = a.split("/");
  const right = b.split("/");
  const length = Math.min(left.length, right.length);

  for (let i = 0; i < length; i++) {
    if (left[i] === right[i]) continue;
    const leftIsTemplate = left[i].startsWith("{");
    const rightIsTemplate = right[i].startsWith("{");
    if (leftIsTemplate !== rightIsTemplate) return leftIsTemplate ? 1 : -1;
    return left[i].localeCompare(right[i]);
  }

  return left.length - right.length;
}

swaggerAutogen(outputFile, endpointsFiles, doc).then((result) => {
  if (!result.success) {
    console.error("swagger.json generation failed");
    process.exit(1);
  }
  cleanDoc(result.data);
  fs.writeFileSync(outputFile, JSON.stringify(result.data, null, 2) + "\n");
  console.log("swagger.json generated under OpenAPI 3.0 specification specs");
});
