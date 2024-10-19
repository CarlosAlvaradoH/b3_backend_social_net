import User from "../models/users.js";
import bcrypt from "bcrypt";
import { createToken } from "../services/jwt.js";

// Metodo de prueba del controlador user
export const testUser = (req, res) => {
  return res.status(200).send({
    message: "Mensaje enviado desde el controlador de usuarios"
  });
};

//Metodo registro de usuarios

export const register = async (req, res) => {
  try {
    // Obtener los datos de la peticion
    let params = req.body;

    // Validar los datos obtenidos
    if (
      !params.name ||
      !params.last_name ||
      !params.nick ||
      !params.email ||
      !params.password
    ) {
      return res.status(400).json({
        status: "error",
        messaje: "Faltan datos por enviar"
      });
    }

    // Crear el objeto del usuario  con los datos que validamos
    let user_to_save = new User(params);

    // Control de usuarios duplicados

    const existingUser = await User.findOne({
      $or: [
        { email: user_to_save.email.toLowerCase() },
        { nick: user_to_save.nick.toLowerCase() }
      ]
    });

    //Validar el existingUser
    if (existingUser) {
      console.log("usuario que existe", existingUser);
      return res.status(409).send({
        status: "error",
        message: "El usuario ya existe"
      });
    }

    //  Cifrar la contraseña
    //genera saltos para encriptar
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user_to_save.password, salt);

    //Asignar pass encriptada al objeto del usuario
    user_to_save.password = hashedPassword;

    //Guardar usuario en la base de datos
    await user_to_save.save();

    // Devolver el Usuario registrado
    return res.status(201).json({
      status: "created",
      messaje: "Registro Exitoso",
      user_to_save
    });
  } catch (error) {
    console.log("Error en el registro de usuario: ", error);
    //Devolver mensaje de error
    return res.status(500).send({
      status: "error",
      message: "Error en el registro de usuario"
    });
  }
};

//Metodo de Login (usar JWT)

export const login = async (req, res) => {
  try {
    //Obtener los parametros del body enviados en la peticion
    let params = req.body;

    //Validar que si recibimos el email y el password
    if (!params.email || !params.password) {
      return res.status(400).send({
        status: "error",
        messaje: "Faltan datos por enviar"
      });
    }

    //Buscar en la BD si existe el email registrado
    const userDB = await User.findOne({ email: params.email.toLowerCase() });

    //Si no existe el usuario buscado
    if (!userDB) {
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado"
      });
    }

    //Comprobar Password
    const validPassword = await bcrypt.compare(
      params.password,
      userDB.password
    );

    //Si el password es incorrecta (false)
    if (!validPassword) {
      return res.status(401).send({
        status: "error",
        message: "Contraseña Incorrecta"
      });
    }

    //Generar Token de autenticacion (JWT)
    const token = createToken(userDB);

    return res.status(200).json({
      status: "success",
      messaje: "Autenticacion Exitosa",
      token,
      userDB: {
        id: userDB._id,
        name: userDB.name,
        last_name: userDB.last_name,
        email: userDB.email,
        nick: userDB.nick,
        image: userDB.image
      }
    });
  } catch (error) {
    console.log("Error en el registro de usuario: ", error);
    //Devolver mensaje de error
    return res.status(500).send({
      status: "error",
      message: "Error en la autenticacion de usuario"
    });
  }
};

export const profile = async (req, res) => {
  try {
    // Obtener el ID del usuario desde los parametros de la Url
    const userId = req.params.id;

    //Verificar si el ID del usuario autenticado esta disponible
    if (!userId || !req.user.userId) {
      return res.status(401).send({
        status: "success",
        message: "Usuario no autenticado"
      });
    }

    // Buscar el usuario en la BD y excluimos los datos que on queremos mostrar
    const userProfile = await User.findById(userId).select(
      "-password -role -email -__v"
    );

    //Verificar si el usuario buscado no existe
    if (!userProfile) {
      return res.status(404).send({
        status: "success",
        message: "Usuario no encontrado"
      });
    }

    //Devolver la informacion del usuario solicitado
    return res.status(200).json({
      status: "success",
      user: userProfile
    });
  } catch (error) {
    console.log("Error al obtener el perfil del usuario: ", error);
    return res.status(500).send({
      status: "error",
      message: "Error al obtener el perfil del usuario"
    });
  }
};


export const listUsers = async (req, res) => {
  try {
    // Gestionar la paginacion
    // 1. Controlar la pagina actual
    let page = req.params.page ? parseInt(req.params.page, 10) : 1 

    // 2. Controlar los items por pagina a mostrar 
    let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 4;

    // Realizar consulta paginada
    const options = {
      page: page,
      limit: itemsPerPage,
      select: '-password -role -email -__v'
    };

    const users = await User.paginate({}, options);

    // Si no existen usuarios en la BD
    if (!users || users.docs.length === 0){
      return res.status(404).send({
        status: "error",
        message: "No hay Usuarios disponibles"
      });
    };

    // Devolver Usuarios paginados
    return res.status(200).json({
      status: "success",
      message: "Error al listar los Usuarios",
      users: users.docs,
      totalDocs: users.totalDocs,
      totalPages: users.totalPages,
      currentPage: users.page
    });


  } catch (error) {
    console.log("Error al listar los Usuarios: ", error);
    return res.status(500).send({
      status: "error",
      message: "Error al listar los Usuarios"
    });
  }
}