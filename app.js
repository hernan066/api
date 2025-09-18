require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const helmet = require("helmet");
const cors = require("cors");
const hpp = require("hpp");
const mongoSanitize = require("express-mongo-sanitize");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { attachUser } = require("./src/middlewares/auth");
const { checkJwt } = require("./src/middlewares/checkJwt");

const app = express();

// Seguridad de headers
/* app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // para servir medios
  })
); */

// CORS estricto (ajusta origins permitidos)
/* app.use(
  cors({
    origin: [process.env.ORIGIN || "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Idempotency-Key",
      "X-Request-Id",
    ],
  })
); */

app.use(cors()); // Permitir todas las conexiones (desarrollo)

// Parsing seguro
app.use(express.json({ limit: "1mb" }));
/* app.use(hpp());
app.use(mongoSanitize());
app.use(compression()); */

// Rate limiting general y por rutas sensibles
/* const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20, standardHeaders: true, legacyHeaders: false });
app.use('/auth', authLimiter);

if (process.env.NODE_ENV !== 'production') app.use(morgan('combined')); */

// Conexión a Mongo
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.error(err));

/* const jwtCheck = auth({
  audience: "http://localhost:3040/api",
  issuerBaseURL: "https://dev-idrukgqe0nqbspbk.us.auth0.com/",
  tokenSigningAlg: "RS256",
});

const debugAuth = (req, res, next) => {
  console.log("Authorization header:", req.headers.authorization);
  next();
};

// Usar antes del middleware de auth
app.use(debugAuth); */

// Rutas
app.get("/api/auth/publico", (req, res) => {
  res.json({ msg: "Esta ruta es pública" });
});
app.get("/api/auth/privado", checkJwt, attachUser, (req, res) => {
  res.json({
    msg: "Esta ruta es protegida",
    user: req.auth, // payload del JWT
  });
});

//app.use("/api/auth", require("./src/routes/auth"));
app.use("/api/products", require("./src/routes/products"));
app.use("/api/orders", require("./src/routes/orders"));
app.use("/api/webhooks", require("./src/routes/webhooks"));
app.use("/api/mp", require("./src/routes/marcadopago"));

// 404 & errores centralizados
app.use((req, res, next) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: "InternalError",
    message: process.env.NODE_ENV === "production" ? "" : err.message,
  });
});

const PORT = process.env.PORT || 3040;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
