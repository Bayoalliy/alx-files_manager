import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';
import { ObjectId } from 'mongodb';



export async function getConnect(req, res) {
  let auth = req.get('Authorization');
  if (!auth || !auth.startsWith('Basic ')) {
    res.status(401).json({error: 'Unauthorized'});
    return;
  }
  auth = auth.replace('Basic ', '');
  const decodedAuth = Buffer.from(auth, 'base64').toString('utf-8');
  if (decodedAuth.indexOf(':') < 0) {
    res.status(401).json({error: 'Unauthorized'});
    return;
  }

  const [email, password] = decodedAuth.split(':');
  const user = await dbClient.findUser({email: email});
  if(user && dbClient.isValidUser(user, password)) {
    const token = dbClient.generateToken();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 86400);
    res.json({token: token});
  } else {
    res.status(401).json({error: 'Unauthorized'});
  }
}

export async function getDisconnect(req, res) {
  const token = req.get('X-Token');
  if (!token) {
    res.status(401).json({error: 'Unauthorized'});
    return;
  }

  const userId = await redisClient.get(`auth_${token}`);
  if (userId) {
    redisClient.del(`auth_${token}`);
    res.status(204).send();
  } else {
    res.status(401).json({error: 'Unauthorized'});
  }
}

export async function getMe(req, res) {
  const token = req.get('X-Token');
  if (!token) {
    res.status(401).json({error: 'Unauthorized'});
    return;
  }
  
  const userId = await redisClient.get(`auth_${token}`);
  const objId = new ObjectId(userId);
  const user = await dbClient.findUser({_id: objId});
  if (user) {
    res.json({email: user.email, id: user._id});
  } else {
    res.status(401).json({error: 'Unauthorized'});
  }
}
