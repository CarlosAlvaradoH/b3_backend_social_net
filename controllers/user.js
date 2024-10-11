import User from "../models/users.js"

// Metodo de prueba del controlador user
export const testUser = (req, res) => {
    return res.status(200).send({
        mesaage: "Mensaje enviado desde el controlador de usuarios"
    })
};

//Metodo registro de usuarios

export const register = async (req, res) => {
    try {
        // Obtener los datos de la peticion
        let params = req.body;

        // Validar los datos obtenidos
        if (!params.name || !params.last_name || !params.nick || !params.email || !params.password) {
            return res.status(400).json({
                status: "error",
                messaje: "Faltan datos por enviar"
            })
        }

        // Crear el objeto del usuario  con los datos que validamos
        let user_to_save = new User(params)

        //Guardar usuario en la base de datos
        await user_to_save.save();
        
        // Control de usuarios duplicados

        //  Cifrar la contraseña

        // Devolver el Usuario registrado
        return res.status(200).json({
            messaje: "Registro Exitoso",
            params,
            user_to_save
        })

    } catch (error) {
        console.log("Error en el registro de usuario: ", error);
        //Devolver mensaje de error
        return res.status(500).send({
            status: "error",
            message: "Error en el registro de usuario"
        })
    }
}