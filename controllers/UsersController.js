import dbClient from '../utils/db';
import { createHash } from 'crypto';
import { addJob, messageQueue } from '../worker.js';

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
    addJob({userId: user.insertedId, email: user.email}, messageQueue);
    res.json({id: user.insertedId, email: req.body.email});
  }
}
