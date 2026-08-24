// update all the waveforms in the database

import fs from 'fs';
import path from 'path';

import { Pool } from 'pg';
import dotenv from 'dotenv';

import { spawn } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
import sharp from 'sharp';

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

async function waveformToPng(waveform: number[], options: WaveformOptions) {
  const {
    width = 1200,
    height = 240,
    background = "#ffffff",
    foreground = "#2563eb",
    gap = 2
  } = options; 

  const centerY = height / 2;
  const usableHeight = height * 0.9;
  
  // 1. Get the actual number of data points
  const count = waveform.length;
  if (count === 0) return sharp(Buffer.from(`<svg width="${width}" height="${height}"></svg>`)).png().toBuffer();

  // 2. Dynamically calculate the step and bar width based on the total width available
  const step = width / count;
  const dynamicBarWidth = Math.max(1, step - gap); // Ensure bar width is at least 1px

  let bars = "";

  for (let i = 0; i < count; i++) {
    const value = Math.max(0, Math.min(1, waveform[i]));
    const barHeight = Math.max(2, value * usableHeight);
    
    // 3. X position is now proportionally spread out across the canvas
    const x = i * step;
    const y = centerY - barHeight / 2;

    bars += `
      <rect
        x="${x}"
        y="${y}"
        width="${dynamicBarWidth}"
        height="${barHeight}"
        rx="${dynamicBarWidth / 2}"
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

      const waveform: number[] = [];

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

/* async function waveformToPng(waveform: number[], options: WaveformOptions) {

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
    } */

export const query = (text: string, params?: any[]) => {
    return pool.query(text, params);
}; 

const UPLOAD_DIR = '/var/www/mp3';

try {
  // Format the INTERVAL length into a clean MM:SS string structure
  const sql = `
  SELECT id, song_name, description, TO_CHAR(length, 'MI:SS') AS duration, filename, image 
  FROM songs 
  ORDER BY id DESC;
    `;
    
  const result = await query(sql);

  for (let i=0; i<result.rows.length; i++) {
    //    if (!result.rows[i].image) {
    //    if (true) {
    const filename = result.rows[i].filename;
    const id = result.rows[i].id;
    const waveform = await generateWaveform(`/var/www/mp3/${filename}`, 120) as number[];
    const imageBuffer = await waveformToPng(waveform, {
      width: 300,
      height: 50,
      foreground: "#2563eb",
      background: "#ffffff",
      barWidth: 6,
      gap: 2
    });

    const sql = `update songs set image = $1 where id = $2`;
    const values = [imageBuffer, id];
    try {
      const result = await query(sql, values);
    } catch (error) {
      console.error('update waveform image error:', error);
    }
    //  }
  }
} catch (error) {
  console.error('update waveform image error:', error);
}

