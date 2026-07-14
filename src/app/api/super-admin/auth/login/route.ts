import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import pool from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET as string

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const { rows } = await pool.query(
      `SELECT id, email, password_hash, role, full_name FROM public.internal_team WHERE email = $1`,
      [email]
    )
    const user = rows[0]

    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    await pool.query(`UPDATE public.internal_team SET last_login_at = now() WHERE id = $1`, [user.id])

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, fullName: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    const cookieStore = await cookies()
    cookieStore.set('magnivo_super_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[SuperAdmin Login Error]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
