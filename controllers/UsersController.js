import dbClient from '../utils/db';
import { createHash } from 'crypto';
import { addJob, messageQueue } from '../worker.js';
import { ObjectId } from 'mongodb';

export async function postNew(req, res) {
  if(!req.body.email) {
    res.status(400).json({error: 'Missing email'});
  } else if (!req.body.password) {
    res.status(400).json({error: 'Missing password'});
  } else if (await dbClient.findUser({email: req.body.email})) {
    res.status(400).json({error: 'Already exists'});
  } else {
    const hashedPwd = dbClient.hashPassword(req.body.password)
    const user = await dbClient.createUser(req.body.email, hashedPwd);
    console.log("Created user id: ", user.insertedId);
    addJob({userId: user.insertedId, email: req.body.email}, messageQueue);
    res.json({id: user.insertedId, email: req.body.email});
  }
}
