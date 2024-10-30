import User from "../models/users.js";
import Follow from "../models/follows.js";
import Publication from "../models/publications.js";
import bcrypt from "bcrypt";
import { createToken } from "../services/jwt.js";
import { followThisUser, followUserIds } from "../services/followServices.js";

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

    // Información de seguimiento: id del usuario identificado (req.user.userId) y el id del usuario del perfil que queremos consultar (userId = req.params.id)
    const followInfo = await followThisUser(req.user.userId, userId);

    //Devolver la informacion del usuario solicitado
    return res.status(200).json({
      status: "success",
      user: userProfile,
      followInfo
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
    let page = req.params.page ? parseInt(req.params.page, 10) : 1;

    // 2. Controlar los items por pagina a mostrar
    let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 4;

    // Realizar consulta paginada
    const options = {
      page: page,
      limit: itemsPerPage,
      select: "-password -role -email -__v"
    };

    const users = await User.paginate({}, options);

    // Si no existen usuarios en la BD
    if (!users || users.docs.length === 0) {
      return res.status(404).send({
        status: "error",
        message: "No hay Usuarios disponibles"
      });
    }

     // Listar los seguidores de un usuario, obtener el array de IDs de los usuarios que sigo
     let followUsers = await followUserIds(req);

    // Devolver Usuarios paginados
    return res.status(200).json({
      status: "success",
      users: users.docs,
      totalDocs: users.totalDocs,
      totalPages: users.totalPages,
      currentPage: users.page,
      users_following: followUsers.following,
      user_follow_me: followUsers.followers
    });
  } catch (error) {
    console.log("Error al listar los Usuarios: ", error);
    return res.status(500).send({
      status: "error",
      message: "Error al listar los Usuarios"
    });
  }
};

export const updateUser = async (req, res) => {
  console.clear();
  console.log("Body: ", req.body);
  console.log("User: ", req.user);
  console.log("Req: ", req);
  try {
    //Obtener Informacion del usuari a actualizar
    let userIdentity = req.user; // El usuario autenticado en el token, lo trae desde el middleware auth.js
    let userToUpdate = req.body; // Recoge los datos nuevos del ususario desde el formualrio

    //Eliminar campos que sobran porqwue no los vamos a actualizar
    delete userToUpdate.iat;
    delete userToUpdate.exp;
    delete userToUpdate.role;

    //Comprobamos si el usuario ya existe en la BD
    const users = await User.find({
      $or: [{ email: userToUpdate.email }, { nick: userToUpdate.nick }]
    }).exec();

    //Verificar si el usuario no esta duplicado para evitar conflictos
    const isDuplicateUser = users.some((user) => {
      return user && user._id.toString() !== userIdentity.userId;
    });

    if (isDuplicateUser) {
      return res.status(400).send({
        status: "error",
        message:
          "Error, solo se puede actualizar los datos del usuario logueado"
      });
    }

    //Cifrar la contrase;a en caso que la envien en la peticion
    if (userToUpdate.password) {
      try {
        let pwd = await bcrypt.hash(userToUpdate.password, 10);
        userToUpdate.password = pwd;
      } catch (hashError) {
        return res.status(500).send({
          status: "error",
          message: "Error al cifrar la contraseña"
        });
      }
    } else {
      delete userToUpdate.password;
    }

    // Buscar y Actualizar el usuario en Mongo
    let userUpdated = await User.findByIdAndUpdate(
      userIdentity.userId,
      userToUpdate,
      { new: true }
    );

    if (!userUpdated) {
      console.log("userUpdated: ", userUpdated);
      return res.status(400).send({
        status: "error",
        message: "Error al actualizar el Usuario 2.0 "
      });
    }

    //Devolver la respuesta exitosa
    return res.status(200).json({
      status: "success",
      message: "Usuario actualizado Correctamente",
      user: userUpdated
    });
  } catch (error) {
    console.log("Error al actualizar el usuario 3.0: ", error);
    return res.status(500).send({
      status: "error",
      message: "Error al actualizar los Usuario"
    });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    //Verificar si se ha subido un archivo
    if (!req.file) {
      return res.status(400).send({
        status: "error",
        message: "La peticion no incluye la imagen del avatar"
      });
    }

    //Obtener la url del archivo en Cloudinary
    const avaratUrl = req.file.path;

    //Guardar la Imagen en la base de datos
    const userUpdated = await User.findByIdAndUpdate(
      req.user.userId,
      { image: avaratUrl },
      { new: true }
    );

    //verificar si la actualizacion fue exitosa
    if (!userUpdated) {
      return res.status(500).send({
        status: "error",
        message: "Error al subir imagen del avatar pero 2.0"
      });
    }

    // Devolver Una respuesta Exitosa
    return res.status(200).json({
      status: "success",
      user: userUpdated,
      file: avaratUrl
    });
  } catch (error) {
    console.log("Error al subir archivos");
    return res.status(500).send({
      status: "error",
      message: "Error al subir imagen del avatar"
    });
  }
};

//Metodo para mostrar Avatar
export const avatar = async (req, res) => {
  console.log('El file: ', req.params.id)
  try {
    // Obtener el ID desde el parametro del archivo
    const userId = req.params.id;

    // Buscar el usuario en la base de datos para obtener la URL de cloudinary
    const user = await User.findById(userId).select("image");

    // Verificar si el usuario existe y tiene una imagen
    if (!user || !user.image) {
      return res.status(500).send({
        status: "error",
        message: "No existe usuario o imagen"
      });
    }

    // Devolver la url de la imagen desde cloudinary
    return res.redirect(user.image);
    
  } catch (error) {
    console.log("Error al mostrar el avarar");
    return res.status(500).send({
      status: "error",
      message: "Error al mostrar el archivo del avatar"
    });
  }
};

export const counters = async (req, res) => {
  try {
    // Obtener el Id del usuario autenticado (token)
    let userId = req.user.userId;


    // Si llega el id a través de los parámetros en la URL tiene prioridad
    if(req.params.id){
      userId = req.params.id;
    }

    // Obtener el nombre y apellido del usuario
    const user = await User.findById(userId, { name: 1, last_name: 1});



    // Vericar el user
    if(!user){
      return res.status(404).send({
        status: "error",
        message: "Usuario no encontrado"
      });
    }

    // Contador de usuarios que yo sigo (o que sigue el usuario autenticado)
    const followingCount = await Follow.countDocuments({ "following_user": userId });

    // Contador de usuarios que me siguen a mi (que siguen al usuario autenticado)
    const followedCount = await Follow.countDocuments({ "followed_user": userId });

    // Contador de publicaciones del usuario autenticado
    const publicationsCount = await Publication.countDocuments({ "user_id": userId });

    // Devolver los contadores
    return res.status(200).json({
      status: "success",
      userId,
      name: user.name,
      last_name: user.last_name,
      followingCount: followingCount,
      followedCount: followedCount,
      publicationsCount: publicationsCount
    });

  } catch (error) {
    return res.status(500).send({
      status: "error",
      message: "Error en los contadores"
    });
  }
}