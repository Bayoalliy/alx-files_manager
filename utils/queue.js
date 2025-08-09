import Queue from 'bull';
import fs from 'fs';
import dbClient from '../utils/db.js';
import imageThumbnail from 'image-thumbnail';

class Thumbnail {
  constructor() {
    this.myQueue = new Queue('fileQueue');
  }

  async addJob(data) {
    return await this.myQueue.add(data);
  }

  async processJob() {
    this.myQueue.process('fileQueue', async (job) => {
      if (!job.data.fileId) {
        throw new Error("Missing fileId");
      } else if (!job.data.userId) {
        throw new Error("Missing userId");
      }
      const fileId = job.data.fileId, userId = job.data.userId;
      const path = file.data.localPath;
      const file = dbClient.findFile({_id: fileId, userId: userId});
      if (!file) {
        throw new Error("File not found");
      }
      const widths = [500, 250, 100];
      
      try {
        for (const width of widths) {
          const tmbnail = await imageThumbnail(path, {width: width});
          fs.writeFile(`${path}_${width}`, tmbnail, (err) => {
            if(err) throw err;
            });
	}
      } catch (err) {
        throw new Error("cant Create thumbnail:", err);
      }
    }
  }
}

const thumbnail = Thumbnail();
export default thumbnail;
