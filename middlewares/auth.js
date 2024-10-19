import jwt from "jwt-simple";
import moment from "moment";
import { secret } from "../services/jwt.js"  // Importar Clave Secreta


// Metrodo de Autenticacion
export const ensureAuth = (req, res, next) => {
    // Comporbar si llega la cabecera de Autenticacion
    if(!req.headers.authorization){
        return res.status(403).send({
            status: "error",
            message: "La peticion no tiene la cabecera de autenticacion"
        });
    }

    //Limpiar el token si trae comillas
    const token = req.headers.authorization.replace(/['"]+/g, '').replace("Bearer ", "");

    try {
        // Decodificar el token
        let payload = jwt.decode(token, secret);

        //Comprobar si eltoken ha expirado (si la fecha de expiracion es mas antigua que la fecha actual)

        if(payload.exp <= moment.unix()){
            return res.status(401).send({
                status: "error",
                message: "El token ha expirado"
            });
        }
        // Agregar datos del usuario a la request
        req.user = payload;

    } catch (error) {
         return res.status(404).send({
                status: "error",
                message: "El token no es valido"
            });
    }

    // Paso a ejecucion al siguiente metodo
    next();
}




