import { Queue, Worker } from 'bullmq';
import { bullRedis } from './redis';

export const emailQueue = new Queue('email-queue', {
    connection: bullRedis
})