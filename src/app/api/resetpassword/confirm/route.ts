import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { token, email, password } = await req.json();
    if (!token || !email || !password) {
      return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
    }

    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: '101acer',
    });

    const [rows]: any = await connection.execute(
      'SELECT * FROM password_resets WHERE email = ? AND token = ? AND expires_at > NOW()',
      [email, token]
    );

    if (rows.length === 0) {
      await connection.end();
      return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.execute(
      'UPDATE user SET password = ? WHERE email = ?',
      [hashedPassword, email]
    );

    await connection.execute('DELETE FROM password_resets WHERE email = ?', [email]);

    await connection.end();

    return NextResponse.json({ message: 'Password has been reset successfully.' });

  } catch (err) {
    console.error('Error resetting password:', err);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
