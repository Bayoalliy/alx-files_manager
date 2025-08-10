import Queue from 'bull';
import fs from 'fs';
import dbClient from './utils/db.js';
import imageThumbnail from 'image-thumbnail';
import { ObjectId } from 'mongodb';


console.log("Worker process Started");

const thumbnailQueue = new Queue('fileQueue');
thumbnailQueue
  .on('completed', (job) => {
      console.log(`Thumbnails of file ${job.data._id} created`);
    })
  .on('failed', (job, err) => {
      console.error(`job ${job.id} failed! with:`, err);
    });


const messageQueue = new Queue('userQueue');
messageQueue
  .on('completed', (job) => {
      console.log(`Welcome message sent to ${job.data.email}`);
    })
  .on('failed', (job, err) => {
      console.error(`job ${job.id} failed! with:`, err);
    });

export async function addJob(data, queue) {
  try {
    const job = await queue.add({...data});
    console.log(`job of id: ${job.id} added`);
    return job;
  } catch (err){
    console.error(`job adding failed!:`, err);
  }
}


(async () =>  {
  thumbnailQueue.process(async (job) => {
    console.log("Thumbnail Job processing started");
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
})();


(async () =>  {
  messageQueue.process(async (job) => {
    console.log("Welcome email Job processing started");
    try {
      if (!job.data.userId) {
        throw new Error("Missing userId");
      }
      const user = await dbClient.findUser({email: job.data.email});
      if(!user) {
        throw new Error("User not found");
      }
      console.log(`Welcome ${user.email}`);
    } catch (err) {
        console.error("can't send welcome email:", err);
    }
  });
})();


export { thumbnailQueue, messageQueue };
