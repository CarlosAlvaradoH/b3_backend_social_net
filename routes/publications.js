import { Router } from 'express'
import { ensureAuth } from '../middlewares/auth.js';
import { testPublication, savePublication, showPublication, deletePublication, publicationsUser, uploadMedia,showMedia, feed } from '../controllers/publication.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import { v2 as cloudinary} from 'cloudinary'
import pkg from 'cloudinary';
const { v2: cloudinary } = pkg;


import multer from 'multer';

//Configuracion de la subida
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'publications',
        allowedFormats: ['jpg', 'png', 'jpeg', 'gif'], //formatos permitidos
        public_id: (req, file) => 'publication-' + Date.now 
    }
});

//cConfigurar multer con limites de tamano de archivos
const uploads = multer({
    storage: storage,
    limits: { fileSize: 1 * 1024 * 1024 } // Limitando a un mega
});

const router = Router();

//Definir rutas de follows
router.get('/test-publication', ensureAuth, testPublication);
router.post('/new-publication', ensureAuth, savePublication);
router.get('/show-publication/:id', ensureAuth, showPublication);
router.delete('/delete-publication/:id', ensureAuth, deletePublication);
router.get('/publications-user/:id/:page?', ensureAuth, publicationsUser);
router.post('/upload-media/:id', [ensureAuth, uploads.single("file0")], uploadMedia);
router.get('/media/:id', showMedia);
router.get('/feed/:page?', ensureAuth, feed);

// Exportar el Router
export default router;