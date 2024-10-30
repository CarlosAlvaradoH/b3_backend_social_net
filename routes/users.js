import { Router } from 'express';
import { login, register, testUser, profile, listUsers, updateUser, uploadAvatar, avatar, counters } from "../controllers/user.js";
import { ensureAuth as ensureAuth} from '../middlewares/auth.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
// import { v2 as cloudinary} from 'cloudinary'
import pkg from 'cloudinary';
const { v2: cloudinary } = pkg;


import multer from 'multer';

//Configuracion de la subida
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'avatars',
        allowedFormats: ['jpg', 'png', 'jpeg', 'gif'], //formatos permitidos
        public_id: (req, file) => 'avatar-' + Date.now 
    }
});

//cConfigurar multer con limites de tamano de archivos
const uploads = multer({
    storage: storage,
    limits: { fileSize: 1 * 1024 * 1024 } // Limitando a un mega
});

const router = Router();

//Definir rutas de user
router.get('/test-user', ensureAuth, testUser);
router.post('/register', register);
router.post('/login', login);
router.get('/profile/:id', ensureAuth, profile);
router.get('/list/:page?', ensureAuth, listUsers);
router.put('/update', ensureAuth, updateUser);
router.post('/upload-avatar', ensureAuth, uploads.single("file0"), uploadAvatar);
router.get('/avatar/:id', ensureAuth, avatar);
router.get('/counters/:id?', ensureAuth, counters);

// Exportar el Router
export default router;