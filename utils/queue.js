import Queue from 'bull';
import fs from 'fs';
import dbClient from '../utils/db.js';
import imageThumbnail from 'image-thumbnail';

class Thumbnail {
  constructor() {
    this.myQueue = new Queue('fileQueue');
    this.myQueue.on('completed', (job) => {
      console.log(`Thumbnails of file ${job.data._id} created`);
    });
    this.myQueue.on('failed', (job, err) => {
      console.error(`job ${job.id} failed! with:`, err);
    });
    this.processJob();
  }

  async addJob(data) {
    try {
      const job = await this.myQueue.add({...data});
      console.log(`job ${job.data.name} of id: ${job.id} added`);
      return job;
    } catch (err){
      console.error(`job adding failed!:`, err);
    }
  }

  async processJob() {
    this.myQueue.process(async (job) => {
      console.log("Job processing started");
      try {
        if (!job.data._id) {
          throw new Error("Missing fileId");
        } else if (!job.data.userId) {
          throw new Error("Missing userId");
        }
        const userId = job.data.userId;
        const fileId = job.data._id;
        const path = job.data.localPath;
        //console.log("finding file in db");
        const file = dbClient.findFile({_id: fileId, userId: userId});
        if (!file) {
          throw new Error("File not found");
        }
        const widths = [500, 250, 100];
      
        //console.log("Making thumbnails");
        for (const width of widths) {
          const tmbnail = await imageThumbnail(path, {width: width});
          await fs.writeFile(`${path}_${width}`, tmbnail, (err) => {
            if(err) throw err;
	  });
        }
      } catch (err) {
          console.error("cant Create thumbnail:", err);
      }
    });
  }
}

const thumbnail = new Thumbnail();
export default thumbnail;
