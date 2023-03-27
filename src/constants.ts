import * as config from './config';
import { config as configEnv } from 'dotenv';

configEnv({});
export const API_BASE_URL = config['backend-base-url'];
export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
export const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;
