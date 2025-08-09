import { MongoClient } from 'mongodb';
import { createHash, randomUUID } from 'crypto';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || '27017';
    this.database = process.env.DATABASE || 'files_manager';
    this.uri = `mongodb://${this.host}:${this.port}`;
    this.client = new MongoClient(this.uri, {useUnifiedTopology: true,});
    try {
      this.client.connect();
    } catch (err) {
      console.error("cant connect to database");
    }
  }

  isAlive() {
    return(this.client?.topology?.isConnected?.());
  }

  async nbUsers() {
    try {
      const db = this.client.db(this.database);
      const collection = db.collection('users');
      return(await collection.countDocuments());
    } catch (err) {
        console.error("something is wrong in nbUsers:", err);
    }
  }

  async nbFiles() {
    try {
      const db = this.client.db(this.database);
      const collection = db.collection('files');
      return(await collection.countDocuments());
    } catch (err) {
        console.error("something is wrong in nbFiles:", err);
    }
  }

  generateToken() {
    return(randomUUID());
  }
  
  hashPassword(password) {
    const hashedPwd = createHash('sha1')
      .update(password)
      .digest('hex');
    return(hashedPwd);
  }

  async createUser(email, hashedPwd) {
    try {
      const db = this.client.db(this.database);
      const collection = db.collection('users');
      return(await collection.insertOne({email: email, password: hashedPwd}));
    } catch (err) {
      console.error('something is wrong with createUser:', err);
    }
  }

  async createFile(dic) {
    try {
      const db = this.client.db(this.database);
      const collection = db.collection('files');
      return(await collection.insertOne(dic));
    } catch (err) {
      console.error('something is wrong with createFile:', err);
    }
  }
    

  async findUser(dic) {
    try {
      const db = this.client.db(this.database);
      const collection = db.collection('users');
      return(await collection.findOne(dic));
    } catch (err) {
      console.error('something is wrong with findUser:', err);
    }
  }

  async findFile(dic) {
    try {
      const db = this.client.db(this.database);
      const collection = db.collection('files');
      return(await collection.findOne(dic, { projection: {
	_id: 0 
      } }));
    } catch (err) {
      console.error('something is wrong with findUser:', err);
    }
  }

  async findFiles(dic, page) {
    try {
      const db = this.client.db(this.database);
      const collection = db.collection('files');
      return(await collection.aggregate([
	{ $match: dic },
        { $sort: { _id: 1 } },
        { $skip: 20*page },
        { $limit: 20 },
	{ $project: {
	  id: "$_id",
	  _id: 0,
	  type: 1,
	  userId: 1,
	  name: 1,
	  parentId: 1,
	  isPublic: 1
	} }
      ]).toArray());
    } catch (err) {
        console.error('something is wrong with findFiles:', err);
    }
  }

  async updateFile(filter, field) {
    try {
      const db = this.client.db(this.database);
      const collection = db.collection('files');
      return(await collection.updateOne(filter, { $set: field }));
    } catch (err) {
      console.error('something is wrong with updateFile:', err);
    }
  }
    

  async isValidUser(user, password) {
    if (user) {
      if (user.password === this.hashPassword(password)) {
        return(true);
      }
    }
    return(false);
  }
}

const dbClient = new DBClient();
export default dbClient;
