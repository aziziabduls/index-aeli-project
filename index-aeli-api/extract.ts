import * as fs from 'fs';
import * as path from 'path';

// Define a type-safe fallback for __dirname to satisfy the compiler
declare const __dirname: string;

function getDirname(): string {
  try {
    return __dirname;
  } catch {
    return process.cwd();
  }
}

const dirname = getDirname();
console.log('Target directory:', dirname);
