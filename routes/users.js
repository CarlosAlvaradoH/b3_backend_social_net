import { Router } from 'express';
import { login, register, testUser, profile, listUsers } from "../controllers/user.js";
import { ensureAuth as ensureAuth} from '../middlewares/auth.js';


const router = Router();

//Definir rutas de user
router.get('/test-user', ensureAuth, testUser);
router.post('/register', register);
router.post('/login', login);
router.get('/profile/:id', ensureAuth, profile);
router.get('/list/:page?', ensureAuth, listUsers);

// Exportar el Router
export default router;