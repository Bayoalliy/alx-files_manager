import express from 'express';
import { getStatus, getStats } from '../controllers/AppController.js'
import { postNew } from '../controllers/UsersController.js'
import { getConnect, getDisconnect, getMe } from '../controllers/AuthController.js'

const router = express.Router();
router.get('/status', getStatus);
router.get('/stats', getStats);
router.post('/users', postNew);
router.get('/connect', getConnect);
router.get('/disconnect', getDisconnect);
router.get('/users/me', getMe);

export default router;
