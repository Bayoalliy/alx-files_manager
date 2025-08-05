import express from 'express';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';


export function getStatus(req, res) {
  const redisStatus = redisClient.isAlive();
  const dbStatus = dbClient.isAlive();
  res.json({redis: redisStatus, db: dbStatus});
};

export function getStats(req, res) {
  const userCount = dbClient.nbUsers();
  const fileCount = dbClient.nbFiles();
  res.json({users: userCount, files: fileCount});
}
