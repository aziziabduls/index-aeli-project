import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { AppError } from '../errors.js';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey123!';

// Active sessions in memory for tracking refresh tokens
const refreshTokens = new Set<string>();

export interface LoginParams {
  email?: string;
  password?: string;
}

export interface RegisterParams {
  email?: string;
  password?: string;
}

export interface RefreshTokenParams {
  refreshToken?: string;
}

export class AuthService {
  async login({ email, password }: LoginParams) {
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const { rows } = await pool.query('SELECT * FROM identity.users WHERE email = $1;', [email]);
    if (rows.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = rows[0];
    if (user.status !== 'active') {
      throw new AppError('User account is inactive', 403);
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new AppError('Invalid email or password', 401);
    }

    const roleQuery = await pool.query(
      'SELECT permission_sets FROM identity.roles WHERE key = $1;',
      [user.role]
    );
    const permissions: string[] = roleQuery.rows[0]?.permission_sets || [];

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, permissions },
      jwtSecret,
      { expiresIn: '8h' }
    );
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, permissions },
      jwtSecret,
      { expiresIn: '7d' }
    );

    refreshTokens.add(refreshToken);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, permissions }
    };
  }

  async register({ email, password }: RegisterParams) {
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    try {
      const { rows: countRows } = await pool.query('SELECT COUNT(*) FROM identity.users;');
      const isFirstUser = parseInt(countRows[0].count, 10) === 0;
      const isSuperAdminEmail = email.toLowerCase() === 'superadmin@indexaeli.com';
      const initialRole = isFirstUser || isSuperAdminEmail ? 'super_admin' : 'content_editor';

      const hash = await bcrypt.hash(password, 10);
      const { rows } = await pool.query(
        'INSERT INTO identity.users (email, password_hash, role, status) VALUES ($1, $2, $3, $4) RETURNING id, email, role, status, created_at;',
        [email, hash, initialRole, 'active']
      );
      return rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw new AppError('Email already exists', 409);
      }
      throw err;
    }
  }

  refreshToken({ refreshToken }: RefreshTokenParams) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    if (!refreshTokens.has(refreshToken)) {
      throw new AppError('Invalid refresh token', 403);
    }

    try {
      const payload = jwt.verify(refreshToken, jwtSecret) as any;
      const accessToken = jwt.sign(
        { id: payload.id, email: payload.email, role: payload.role },
        jwtSecret,
        { expiresIn: '15m' }
      );
      return { accessToken };
    } catch (err) {
      throw new AppError('Invalid refresh token', 403);
    }
  }

  logout({ refreshToken }: RefreshTokenParams) {
    if (refreshToken) {
      refreshTokens.delete(refreshToken);
    }
    return { message: 'Logged out successfully' };
  }
}

export const authService = new AuthService();

