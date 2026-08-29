// In-process job queue stub (spec section 30).
// Real deployments swap this module's internals for SQS/Cloud Tasks/BullMQ —
// callers only ever use enqueue()/getStatus(), so that swap touches one file.

const jobs = new Map(); // jobId -> { status, progress, result, error }

function enqueue(jobFn) {
  const id = crypto.randomUUID();
  jobs.set(id, { status: 'queued', progress: 0, result: null, error: null });

  // Fire and forget — a real queue would run this in a separate worker process.
  setImmediate(async () => {
    const job = jobs.get(id);
    job.status = 'running';
    try {
      const result = await jobFn((progress) => {
        job.progress = progress;
      });
      job.status = 'complete';
      job.progress = 100;
      job.result = result;
    } catch (err) {
      job.status = 'failed';
      job.error = err.message;
    }
  });

  return id;
}

function getStatus(jobId) {
  return jobs.get(jobId) || null;
}

module.exports = { enqueue, getStatus };
