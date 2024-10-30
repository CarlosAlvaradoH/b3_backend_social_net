import Publication from '../models/publications.js'
import { followUserIds } from '../services/followServices.js'

export const testPublication = (req, res) => {
    return res.status(200).send({
        message: "Test encviado desde el controlador de Publicaciones"
    })
}

// Metodo para hacer ( guardar en DB) una publicacion
export const savePublication = async (req, res) => {
    try {
        // Obtenemos los dato del body
        const params = req.body;

        // Verificar que llegue desde el body el parametro text con su informacion
        if (!params.text){
            return res.status(400).send({
                status: "error",
                message: "Debes enviar el texto de la publicacion"
            })
        }

        //Crear objeto del modelo
        let newPublication = new Publication(params);

        // Agregar al objeto de la publicacion la informacion del usuario autenticado quien crea la publicacion
         newPublication.user_id = req.user.userId;

         //Guardar la nueva publicacion
         const publicationStored = await newPublication.save();

         //Verificar que se guardo la nueva publicacion en la DB (si existe)
         if(!publicationStored){
            return res.status(500).send({
                status: "error",
                message: "No se ha guardado la publicacion"
            })
         };

         // Devolver respuesta exitosa
         return res.status(200).json({
            status: "success",
            message: "Publicacion Creada con Exito",
            publicationStored
        })
    } catch (error) {
        console.log(`Error al crear la publicacion ${error}`);
        return res.status(500).send({
            status: "error",
            message: "Error al crear la publicacion"
        })
    }
}

// Metodo para mostrar la publicacion
export const showPublication = async (req, res) => {
    try {
        // Obtener el id de la publicacion desde la url (parametros)
        const publicationId = req.params.id;

        // Buscar la publicacion en la base de datos
        const publicationStored = await Publication.findById(publicationId)
        .populate('user_id', 'name last_name');

        // Verificar si existe la publicacion
        if(!publicationStored){
            return res.status(404).send({
                status: "error",
                message: "No existe la publicacion"
            })
        }

        // Devolver la respueata exitosa
        return res.status(200).json({
            status: "success",
            message: "Publicacion Encontrada",
            publication: publicationStored
        })


    } catch (error) {
        console.log(`Error al mostrar la publicacion ${error}`);
        return res.status(500).send({
            status: "error",
            message: "Error al mostra la publicacion"
        })
    }
};

// Metodo para eliminar publicacion
export const deletePublication = async (req, res) => {
    try {
         // Obtener el id de la publicacion desde la url (parametros)
         const publicationId = req.params.id;

         // Buscar la publicacion en la base de datos y la eliminamos
         const publicationDeleted = await Publication.findOneAndDelete({user_id: req.user.userId, _id: publicationId})
         .populate('user_id', 'name last_name');
 
         // Verificar si existe la publicacion en la Db y se elimino de la DB
         if(!publicationDeleted){
             return res.status(404).send({
                 status: "error",
                 message: "No se ha encontrado o no tienes permiso para eliminar esta publicacion"
             })
         }
 
         // Devolver la respueata exitosa
         return res.status(200).json({
             status: "success",
             message: "Publicacion Eliminada con exito",
             publication: publicationDeleted
         })
    } catch (error) {
        console.log(`Error al eliminar la publicacion ${error}`);
        return res.status(500).send({
            status: "error",
            message: "Error al eliminar la publicacion"
        })
    }
};
// Metodo para listar las publicaciones de un usuario en particular, enviadnole el id del usuario en los parametros de la URL
export const publicationsUser = async (req, res) => {
    try {
        // Obtener el Id del usuario
        const userId = req.params.id;

        // Aisgnar el numero de pagina a mostrar inicialmente
        let page = req.params.page ? parseInt(req.params.page, 10) : 1;
        
        // Numero de publicaciones que queremos mostrar por pagina
        let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 5;

        //Opciones para la consulta
        const options = {
            page: page,
            limit: itemsPerPage,
            sort: { create_at: -1},
            populate: {
                path: 'user_id',
                select: '-password -role -__v -email'
            },
            lean: true
        }

        // Buscar Publicacions de ese usuario
        const publications = await Publication.paginate({user_id: userId}, options);

        // Verificar si existen publicaciones
        if(!publications.docs || publications.docs.length <= 0){
            return res.status(404).send({
                status: "error",
                message: "No hay publicaciones para mostrar"
            })
        }
        
        // Devolver la respueata exitosa
        return res.status(200).json({
            status: "success",
            message: "Publicaciones del usuario",
            publication: publications.docs,
            total: publications.totalDocs,
            pages: publications.totalPages,
            page: publications.page,
            limit_items_ppage: publications.limit
        })

    } catch (error) {
        console.log(`Error al listar las publicaciones ${error}`);
        return res.status(500).send({
            status: "error",
            message: "Error al listar las publicaciones"
        })
    }
};

// Metodo para subir imagenes a las publicaciones
export const uploadMedia = async (req, res) => {
    try {
        // Obtener el Id de la publicacion
        const publicationId = req.params.id;

        // Verificar si la publicacion existe en la BD
        const publicationExist = await Publication.findById(publicationId);

        if(!publicationExist){
            return res.status(500).send({
                status: "error",
                message: "No existe la publicacion"
            })
        };

        // Verificar si se ha recibido en la peticion un archivo
        if(!req.file){
            return res.status(500).send({
                status: "error",
                message: "No se incluyo ninguna imagen"
            })
        }

        // Obtener la ruta de Cloudinary
        const mediaUrl = req.file.path;

        // Actualizar la publicacion con la url de la imagen 
        const publicationUpdated = await Publication
        .findByIdAndUpdate(
            publicationId,
            { file: mediaUrl },
            { new: true }
        );

        if(!publicationUpdated){
            return res.status(500).send({
                status: "error",
                message: "Hubo un error en la subida de la imagen"
            })
        }

        // Devolver la respueata exitosa
        return res.status(200).json({
            status: "success",
            message: "Archivo subiodo con exito",
            publication: publicationUpdated,
            file: mediaUrl
        })
    } catch (error) {
        console.log(`Error al agregar Media a las publicaciones ${error}`);
        return res.status(500).send({
            status: "error",
            message: "Error al agregar Media a las publicaciones"
        })
    }
};

// Método para mostrar el archivo subido a la publicación
export const showMedia = async (req, res) => {
    try {
      // Obtener el id de la publicación
      const publicationId = req.params.id;
  
      // Buscar la publicación en la base de datos
      const publication = await Publication.findById(publicationId).select('file');
  
      // Verificar si la publicación existe y tiene un archivo
      if (!publication || !publication.file) {
        return res.status(404).send({
          status: "error",
          message: "No existe el archivo para esta publicación"
        });
      }
  
      // Redirigir a la URL de la imagen en Cloudinary
      return res.redirect(publication.file);
  
    } catch (error) {
      console.error("Error al mostrar el archivo de la publicación", error);
      return res.status(500).send({
        status: "error",
        message: "Error al mostrar archivo en la publicación"
      });
    }
  }

  
  // Método para listar todas las publicaciones de los usuarios que yo sigo (Feed)
  export const feed = async (req, res) => {
    try {
      // Asignar el número de página
      let page = req.params.page ? parseInt(req.params.page, 10) : 1;
  
      // Número de publicaciones que queremos mostrar por página
      let itemsPerPage = req.query.limit ? parseInt(req.query.limit, 10) : 5;
  
      // Verificar que el usuario autenticado existe y tiene un userId
      if(!req.user || !req.user.userId) {
        return res.status(404).send({
          status: "error",
          message: "Usuario no autenticado"
        });
      }
  
      // Obtener un array de IDs de los usuarios que sigue el usuario autenticado
      const myFollows = await followUserIds(req);
  
      // Verificar que la lista de usuarios que sigo no esté vacía
      if (!myFollows.following || myFollows.following.length === 0){
        return res.status(404).send({
          status: "error",
          message: "No sigues a ningún usuario, no hay publicaciones que mostrar"
        });
      }
  
      // Configurar las options de la consulta
      const options = {
        page: page,
        limit: itemsPerPage,
        sort: { created_at: -1 },
        populate: {
          path: 'user_id',
          select: '-password -role -__v -email'
        },
        lean: true
      };
  
      // Consulta a la base de datos con paginate
      const result = await Publication.paginate(
        { user_id: { $in: myFollows.following }},
        options
      );
  
      // Verificar si se encontraron publicaciones en la BD
      if (!result.docs || result.docs.length <= 0) {
        return res.status(404).send({
          status: "error",
          message: "No hay publicaciones para mostrar"
        });
      }
  
      // Devolver respuesta exitosa
      return res.status(200).json({
        status: "success",
        message: "Feed de Publicaciones",
        publications: result.docs,
        total: result.totalDocs,
        pages: result.totalPages,
        page: result.page,
        limit: result.limit
      });
  
    } catch (error) {
        console.log(error)
      return res.status(500).send({
        status: "error",
        message: "Error al mostrar las publicaciones en el feed"
      });
    }
  }