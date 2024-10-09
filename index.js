// Importar dependencias (configurar en package.json)
import express from "express";
import dotenv from "dotenv";
import connection from "./database/conection.js";
import cors from "cors";
import bodyParser from "body-parser";
import UserRoutes from "./routes/users.js"
import PublicationRoutes from "./routes/publications.js"
import FollowRoutes from "./routes/follow.js"

//Mensaje de bienvenida para verificar que ejecuto la api de node
console.log("API Node en ejecucion");

dotenv.config();

// Usar la conexión a la Base de Datos
connection();

// Crear el servidor node
const app = express();
const puerto = process.env.PORT || 3900;

// Configurar cors para que acepte peticiones del frontend
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST.DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
  })
);

//Decodificar los daros desde los dormularions para concertirlos en onbjetos de javascritp
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extends: true }));

//Configurara rutas del aplicativo (modulos)
app.use('/api/user', UserRoutes);
app.use('/api/publication', PublicationRoutes);
app.use('/api/follow', FollowRoutes);

app.listen(puerto, () => {
  console.log("Servidor de NOde ejecutandose en el puerto: ", puerto);
});

export default app;
