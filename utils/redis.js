import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.alive = false;
    this.client
      .on("error", (err) => {
        console.log('Redis client not connected to the server:', err);
      });
    this.client.connected = true;
  }

  isAlive() {
    return(this.client.connected);
  }

  async get(key) {
    const promiseGet = promisify(this.client.get).bind(this.client);
    const res = await promiseGet(key);
    return(res);
  }

  async set(key, value, duration) {
    await this.client.set(key, value, 'EX', duration);
  }

  async del(key) {
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
