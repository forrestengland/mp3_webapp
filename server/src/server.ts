// mp3 upload web server

import express, { Request, Response } from 'express';

import fs from 'fs';
import path from 'path';

import cors from 'cors';

import multer from 'multer';

import { Pool } from 'pg';
import dotenv from 'dotenv';

import * as musicMetadata from 'music-metadata';

import crypto from 'crypto';

import { spawn } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import sharp from 'sharp';

const PORT = 3003;

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432
});

export interface Session {
  username: string;
}

const sessions: Record<string, Session> = {};

const SECRET_PASSWORD = process.env.LOGIN_SECRET_KEY;

function generateWaveform(inputFile: string, barCount: number) {

  return new Promise((resolve, reject) => {

    const chunks: Buffer[] = [];

    const actualPath = typeof ffmpegPath === 'string' ? ffmpegPath : (ffmpegPath as any).default;    

    const ffmpeg = spawn(actualPath, [
      "-i", inputFile,
      "-f", "s16le", // signed 16 bit pcm
      "-ac", "1", // mono
      "-ar", "8000", // sample rate
      "pipe:1"
    ]);

    ffmpeg.stdout.on("data", chunk =>chunks.push(chunk));
    ffmpeg.stderr.on("data", () => {
      // progress and metadata
    });
    ffmpeg.on("error", reject);
    ffmpeg.on("close", code => {
      if (code !== 0) {
	return reject(new Error(`FFmpeg exited with code ${code}`));
      }

      const pcm = Buffer.concat(chunks);
      const samples = new Int16Array(
	pcm.buffer,
	pcm.byteOffset,
	Math.floor(pcm.length / 2)
      );

      const samplesPerBar = Math.max(1, Math.floor(samples.length / barCount));

      const waveform = [];

      for (let bar=0; bar<barCount; bar++) {
	const start = bar * samplesPerBar;
	const end = Math.min(start + samplesPerBar, samples.length);
	let peak = 0;
	for (let i=start; i<end; i++) {
	  peak = Math.max(peak, Math.abs(samples[i]));
	}
	waveform.push(Number((peak / 32786).toFixed(4)));
	resolve(waveform);
      }
    });
  });
}

interface WaveformOptions {
  width: number;
  height: number;
  background: string;
  foreground: string;
  barWidth: number;
  gap: number;
}

async function waveformToPng(waveform: number[], options: WaveformOptions) {

  const {
    width = 1200,
    height = 240,
    background = "#ffffff",
    foreground = "#2563eb",
    barWidth = 3,
    gap = 2
  } = options;

  const centerY = height / 2;
  const usableHeight = height * 0.9;
  const step = barWidth + gap;
  const count = Math.min(
    waveform.length,
    Math.floor((width + gap) / step)
  );

  let bars = "";

  for (let i = 0; i < count; i++) {
    const value = Math.max(0, Math.min(1, waveform[i]));
    const barHeight = Math.max(2, value * usableHeight);
    const x = i * step;
    const y = centerY - barHeight / 2;

    bars += `
      <rect
        x="${x}"
        y="${y}"
        width="${barWidth}"
        height="${barHeight}"
        rx="${barWidth / 2}"
        fill="${foreground}"
      />
    `;
  }

  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
    >
      <rect width="100%" height="100%" fill="${background}" />
      ${bars}
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .png()
    .toBuffer();
}

function parseCookies(cookieHeader: string) {

  const cookies: Record<string, string> = {};

    if (!cookieHeader) return cookies;

    cookieHeader.split(';').forEach(cookie => {
	const [name, ...rest] = cookie.split('=');
	if (name) {
	    cookies[name.trim()] = rest.join('=').trim();
	}
    });
    return cookies;
}

// check if the user is logged in, return the session id or false if they aren't logged in
function requireAuthentication(req: Request) {

    const cookies = parseCookies(req.headers.cookie || '');
    const sessionId = cookies.session_id;
    const userSession = sessions[sessionId]; // undefined if not logged in
	    
    if (!userSession) {
	return false;
    } else {
	return sessionId;
    }
}

export const query = (text: string, params?: any[]) => {
    return pool.query(text, params);
};

const app = express();
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true}));
app.use('/api/mp3', express.static('/var/www/mp3'));

const UPLOAD_DIR = '/var/www/mp3';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
	cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
	cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// get song info
app.get('/api/song/:id', async(req: Request, res: Response): Promise<void> => {

  try {
    
    const { id } = req.params;
    
    const sql = `select song_name,description from songs where id = $1`;
    const values = [id];
    const result = await query(sql, values);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('upload handler error:', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

// update song info
app.post('/api/update', async(req: Request, res: Response): Promise<void> => {

  if (!requireAuthentication(req)) {
    res.status(400).json({ error: 'you are not logged in' });
    return;
  }

  try {
    
    const { id, song_name, description } = req.body;
    
    const sql = `update songs set song_name = $1, description = $2 where id = $3`;
    const values = [song_name, description, id];
    const result = await query(sql, values);

    res.status(201).json({
      message: 'song update success',
      success: true
    });
  } catch (error) {
    console.error('upload handler error:', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

// delete song
app.post('/api/delete', async(req: Request, res: Response): Promise<void> => {

  if (!requireAuthentication(req)) {
    res.status(400).json({ error: 'you are not logged in' });
    return;
  }

  try {
    
    const { id } = req.body;
    
    const sql = `delete from songs where id = $1`;
    const values = [id];
    const result = await query(sql, values);

    res.status(201).json({
      message: 'song delete success',
      success: true
    });
  } catch (error) {
    console.error('upload handler error:', error);
    res.status(500).json({ error: 'internal server error' });
  }
});

// login api endpoint
app.post('/api/login', async(req: Request, res: Response): Promise<void> => {

    const { password } = req.body;

    if (password === SECRET_PASSWORD) {

	const newSessionId = crypto.randomBytes(16).toString('hex');
	sessions[newSessionId] = { username: 'admin' };
	
	res.status(201).set({'Set-Cookie': `session_id=${newSessionId}; Path=/; httpOnly`}).json({
	    message: 'login success',
	    success: true
	});
    } else {
	res.status(401).json({
	    message: 'login failure - invalid password',
	    success: false
	});
    }
});

// logout api endpoint
app.post('/api/logout', async(req: Request, res: Response): Promise<void> => {

    const cookies = parseCookies(req.headers.cookie || '');
    const sessionId = cookies.session_id;
    const userSession = sessions[sessionId]; // undefined if not logged in

  //    sessions[sessionId] = null;
  delete sessions[sessionId];

    res.clearCookie('connect.sid', {
	path: '/',
	httpOnly: true,
	secure: false
    })
	
    res.json({
	message: 'logout success',
	success: true
    });
});



// upload api endpoint
app.post('/api/upload', upload.single('songFile'),
	 
	 async (req: Request, res: Response): Promise<void> => {

	     if (!requireAuthentication(req)) {
		 res.status(400).json({ error: 'you are not logged in' });
		 return;
	     }
	     
	     try {
		 const {songName, description, minutes, seconds } = req.body;

		 if (!req.file) {
		     res.status(400).json({ error: 'No audio file provided' });
		     return;
		 }

		 const filename = req.file.filename;
		 const filePath = req.file.path;

		 const metadata = await musicMetadata.parseFile(filePath);
		 const totalSeconds = metadata.format.duration;

		 if (!totalSeconds) {
		     res.status(400).json({ error: 'Could not calculate the duration' });
		     return;
		 }
		 
	       const lengthInterval = `${Math.floor(totalSeconds)} seconds`;

	       // TODO - change to use UPLOAD_DIR
	       const waveform = await generateWaveform(`/var/www/mp3/${filename}`, 120) as number[];
	       const imageBuffer = await waveformToPng(waveform, {
		 width: 1200,
		 height: 240,
		 foreground: "#2563eb",
		 background: "#ffffff",
		 barWidth: 3,
		 gap: 2
	       });

	       const sql = `insert into songs (song_name, description, length, filename, image)
	       values ($1, $2, $3, $4, $5)
RETURNING *`;
	       const values = [songName, description, lengthInterval, filename, imageBuffer];
		 const result = await query(sql, values);

		 res.status(201).json({
		     message: 'song upload success',
		     song: result.rows[0]
		 });
	     } catch (error) {
		 console.error('upload handler error:', error);
		 res.status(500).json({ error: 'internal server error' });
	     }
	 });

// Fetch all songs from the database
app.get('/api/songs', async (req: Request, res: Response): Promise<void> => {
  try {
    // Format the INTERVAL length into a clean MM:SS string structure
    const sql = `
    SELECT id, song_name, description, TO_CHAR(length, 'MI:SS') AS duration, filename, image 
      FROM songs 
      ORDER BY id DESC;
    `;
    
    const result = await query(sql);

    for (let i=0; i<result.rows.length; i++) {
      if (result.rows[i].image) {
	result.rows[i].image = result.rows[i].image.toString('base64');
      }
    }
    
    res.status(200).json(result.rows);
    
  } catch (error) {
    console.error('Fetch songs error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/api/data', async (req, res) => {
    try {
	const result = await query('SELECT * FROM songs');
	res.json({ message: "hello from the typescript express backend!",
		   rows: result.rows });
    } catch (error) {
	console.error('Database query error:', error);
	res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, async () => {
    console.log(`typescript test server running at port ${PORT}`)
    try {
	await query('SELECT NOW()');
	console.log('Successfully connected to postgres database');
    } catch (err) {
	console.error('Database connection failed', err);
    }
});
