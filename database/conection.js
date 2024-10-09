import { connect } from "mongoose";
import  dotenv  from "dotenv";

//Configurar el dotenv para usar variables de entorno
dotenv.config();

const connection = async() => {
    try {
        await connect(process.env.MONGODB_URI);
        console.log("Conectado Correctamente a DB_Social_Network")
    } catch (error) {
        console.log('Hubo un error al conectar la base de datos: ', error);
        throw new Error ("!No se pudo conectar a la base de datos..!");
    }
}

export default connection;