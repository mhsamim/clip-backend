const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const { nanoid } = require('nanoid');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const CLIP_DIR = path.join(__dirname, 'clips');
if (!fs.existsSync(CLIP_DIR)) fs.mkdirSync(CLIP_DIR);

const jobs = {};

function isValidTime(t) {
  return /^\d{2}:\d{2}:\d{2}$/.test(t);
}

app.post('/api/create-job', (req, res) => {
  const { url, start, end } = req.body;

  if (!url || !start || !end) {
    return res.status(400).json({ error: 'url, start, end are required' });
  }
  if (!isValidTime(start) || !isValidTime(end)) {
    return res.status(400).json({ error: 'Times must be HH:MM:SS' });
  }

  const jobId = nanoid();
  const outputFile = `${jobId}.mp4`;
  const outputPath = path.join(CLIP_DIR, outputFile);

  jobs[jobId] = {
    status: 'queued',
    error: null,
    fileName: outputFile,
    url,
    start,
    end,
    createdAt: new Date().toISOString()
  };

  const sectionArg = `*${start}-${end}`;
  const args = [
    '-f', 'bv*+ba/best',
    '--download-sections', sectionArg,
    '--force-keyframes-at-cuts',
    '-o', outputPath,
    url
  ];

  const proc = spawn('yt-dlp', args);

  jobs[jobId].status = 'processing';

  let stderr = '';
  proc.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  proc.on('close', (code) => {
    if (code === 0 && fs.existsSync(outputPath)) {
      jobs[jobId].status = 'done';
    } else {
      jobs[jobId].status = 'error';
      jobs[jobId].error = `yt-dlp exited with code ${code}: ${stderr}`;
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
  });

  res.json({ jobId });
});

app.get('/api/status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) return res.status(404).json({ error: 'Job not found' });

  res.json({
    status: job.status,
    error: job.error,
    downloadUrl:
      job.status === 'done' ? `/clips/${job.fileName}` : null
  });
});

app.use('/clips', express.static(CLIP_DIR));

app.get('/', (_, res) => {
  res.send('Clip backend is running');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
