// mp3 upload web server

import express, { Request, Response } from 'express';

import fs from 'fs';
import path from 'path';

import cors from 'cors';

import multer from 'multer';

import { Pool } from 'pg';
import dotenv from 'dotenv';

import * as musicMetadata from 'music-metadata';

const PORT = 3003;

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432
});

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

// upload api endpoint
app.post('/api/upload', upload.single('songFile'),
	 async (req: Request, res: Response): Promise<void> => {
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
		     res.status(400).json({ error: 'Could not calculate the duration' })
		     return;
		 }
		 
		 const lengthInterval = `${Math.floor(totalSeconds)} seconds`;

		 const sql = `insert into songs (song_name, description, length, filename)
values ($1, $2, $3, $4)
RETURNING *`;
		 const values = [songName, description, lengthInterval, filename];
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
      SELECT id, song_name, description, TO_CHAR(length, 'MI:SS') AS duration, filename 
      FROM songs 
      ORDER BY id DESC;
    `;
    const result = await query(sql);
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
