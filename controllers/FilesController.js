import redisClient from '../utils/redis.js';
import dbClient from '../utils/db.js';
import { ObjectId } from 'mongodb';
import fs from 'fs';


export async function postUpload(req, res) {
  const token = req.get('X-Token');
  if (!token) {
    return res.status(401).json({error: 'Unauthorized'});
  }

  const userId = await redisClient.get(`auth_${token}`);
  const objId = new ObjectId(userId);
  const user = await dbClient.findUser({_id: objId});
  if (!user) {
    return res.status(401).json({error: 'Unauthorized'});
  }
  const fileTypes = ['folder', 'file', 'image'];
  const name = req.body.name;
  const type = req.body.type;
  const parentId = req.body.parentId || 0;
  const isPublic = req.body.isPublic || false;
  const data = req.body.data;

  if (!name) {
    return res.status(400).json({error: 'Name is missing'});
  } else if (!type || !fileTypes.includes(type)) {
    return res.status(400).json({error: 'Missing type'});
  } else if (!data && type != 'folder') {
    return res.status(400).json({error: 'Missing data'});
  } 

  if (parentId) {
    const id = new ObjectId(parentId);
    const file = await dbClient.findFile({_id: id});
    if (!file) {
      return res.status(400).json({error: 'Parent not found'});
    } else if(file.type != 'folder') {
        console.log(user);
        return res.status(400).json({error: 'Parent is not a folder'});
    }
  }

  const fileObj = {
	  	     userId: user._id,
                     name: name,
                     type: type,
                     parentId: parentId,
                     isPublic: isPublic
  		  }

  if (type === 'folder') {
    const file = await dbClient.createFile(fileObj);
    delete fileObj._id;
    return res.status(201).json({id: file.insertedId, ...fileObj});
  } else {
    const fileName = dbClient.generateToken();
    const relativePath = process.env.FOLDER_PATH || '/tmp/files_manager/';
    const localPath = `${relativePath}${fileName}`;
    const decodedData = Buffer.from(data, 'base64').toString('utf-8');
    fs.writeFile(localPath, decodedData, (err) => {
      if(err) throw err;
    });
    fileObj.localPath = localPath;
    const file = await dbClient.createFile(fileObj);
    delete fileObj.localPath;
    delete fileObj._id;
    return res.status(201).json({id: file.insertedId, ...fileObj});
  }
}


export async function getShow(req, res) {
  const token = req.get('X-Token');
  if (!token) {
    return res.status(401).json({error: 'Unauthorized'});
  }

  const userId = await redisClient.get(`auth_${token}`);
  const objId = new ObjectId(userId);
  const user = await dbClient.findUser({_id: objId});
  if (!user) {
    return res.status(401).json({error: 'Unauthorized'});
  }
  
  const fileId = new ObjectId(req.params.id);
  const file = await dbClient.findFile({_id: fileId, userId: objId});
  if (!file) {
    return res.status(404).json({error: 'Not found'});
  }
  file.id = fileId;
  return res.json(file);
}

export async function getIndex(req, res) {
  const token = req.get('X-Token');
  if (!token) {
    return res.status(401).json({error: 'Unauthorized'});
  }

  const userId = await redisClient.get(`auth_${token}`);
  const objId = new ObjectId(userId);
  const user = await dbClient.findUser({_id: objId});
  if (!user) {
    return res.status(401).json({error: 'Unauthorized'});
  }

  const page = req.query.page || 0;
  const parentId = req.query.parentId;
  const dic = {userId: objId};
  if (parentId) {
    dic.parentId = new ObjectId( parentId);
  }
  const files = await dbClient.findFiles(dic, page);
  return res.json(files);
}

export async function putPublish(req, res) {
  const token = req.get('X-Token');
  if (!token) {
    return res.status(401).json({error: 'Unauthorized'});
  }

  const userId = await redisClient.get(`auth_${token}`);
  const objId = new ObjectId(userId);
  const user = await dbClient.findUser({_id: objId});
  if (!user) {
    return res.status(401).json({error: 'Unauthorized'});
  }
  
  const fileId = new ObjectId(req.params.id);
  const file = await dbClient.findFile({_id: fileId, userId: objId});
  if (!file) {
    return res.status(404).json({error: 'Not found'});
  }
  await  dbClient.updateFile({_id: fileId}, {isPublic: true});
  const updatedFile = await dbClient.findFile({_id: fileId});
  return res.json({id: fileId, ...updatedFile});
}


export async function putUnpublish(req, res) {
  const token = req.get('X-Token');
  if (!token) {
    return res.status(401).json({error: 'Unauthorized'});
  }

  const userId = await redisClient.get(`auth_${token}`);
  const objId = new ObjectId(userId);
  const user = await dbClient.findUser({_id: objId});
  if (!user) {
    return res.status(401).json({error: 'Unauthorized'});
  }
  
  const fileId = new ObjectId(req.params.id);
  const file = await dbClient.findFile({_id: fileId, userId: objId});
  if (!file) {
    return res.status(404).json({error: 'Not found'});
  }
  await  dbClient.updateFile({_id: fileId}, {isPublic: false});
  const updatedFile = await dbClient.findFile({_id: fileId});
  return res.json({id: fileId, ...updatedFile});
}

