    import { NextResponse } from 'next/server';
    import mysql from 'mysql2/promise';
    import crypto from 'crypto';
    import nodemailer from 'nodemailer';

    export async function POST(req: Request) {
      try {
        const { email } = await req.json();
        if (!email) {
          return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        console.log("📥 Password reset requested for:", email);

        // Connect to MySQL
        console.log("Connecting to database...");
        const connection = await mysql.createConnection({
          host: 'localhost',
          user: 'root',
          password: '',
          database: '101acer',
        });
        
        const [users]: any = await connection.execute('SELECT * FROM user WHERE email = ?', [email]);
        console.log("Users found:", users);
        

        // Check if email exists in users
        // const [users]: any = await connection.execute('SELECT * FROM user WHERE email = ?', [email]);
        if (users.length === 0) {
          await connection.end();
          return NextResponse.json({
            message: 'If the email exists, you will receive a reset link.',
          });
        }

        // Generate token and expiration time
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Insert token into the database
        await connection.execute('DELETE FROM password_resets WHERE email = ?', [email]);
        await connection.execute(
          'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
          [email, token, expiresAt]
        );

        console.log("🪵 Reset token saved to DB");

        // Set up nodemailer transport
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'sanjanakannajiya9@gmail.com',
            pass: 'dddbabkgihyzxzfa',  
          },
        });
        

        await transporter.verify();
        console.log("✅ Email transporter verified");

        // Generate the reset link
        const resetLink = `http://localhost:3000/reset-password?token=${token}&email=${email}`;

        // Send email with the reset link
        const mailOptions = {
          from: '"Your App" <sanjanakannajiya9@gmail.com>',
          to: email,
          subject: 'Password Reset Request',
          html: `
            <h3>Reset Your Password</h3>
            <p>Click below to reset:</p>
            <a href="${resetLink}">Reset Password</a>
            <p>This link expires in 1 hour.</p>
          `,
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log("📨 Email sent:", info.messageId);

        await connection.end();

        return NextResponse.json({
          message: 'If the email exists, a reset link has been sent.',
        });

      } catch (error: any) {
        console.error("❌ Error in /api/resetpassword:", error);
        return NextResponse.json(
          { message: 'Something went wrong. Please try again later.' },
          { status: 500 }
        );
      }
    }
