import express from 'express';
import { getStatus, getStats } from '../controllers/AppController.js'
import { postNew } from '../controllers/UsersController.js'
import { getConnect, getDisconnect, getMe } from '../controllers/AuthController.js'
import { postUpload, getShow, getIndex, putPublish, putUnpublish, getFile } from '../controllers/FilesController.js';

const router = express.Router();
router.get('/status', getStatus);
router.get('/stats', getStats);
router.post('/users', postNew);
router.get('/connect', getConnect);
router.get('/disconnect', getDisconnect);
router.get('/users/me', getMe);
router.post('/files', postUpload);
router.get('/files/:id', getShow);
router.get('/files', getIndex);
router.put('/files/:id/publish', putPublish);
router.put('/files/:id/unpublish', putUnpublish);
router.get('/files/:id/data', getFile);


export default router;
