'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import Image from 'next/image';

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('❌ Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/resetpassword/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('✅ Password reset successful! Redirecting...');
        setTimeout(() => router.push('/auth-login'), 3000);
      } else {
        setMessage(`❌ ${data.message}`);
      }
    } catch (err) {
      setMessage('❌ Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow bg-white dark:bg-slate-900 text-center">
      {/* Logo */}
      <div className="mb-6">
        <Image
          src="/images/logo1.png"
          alt="Logo"
          width={64}
          height={64}
          className="mx-auto"
        />
      </div>

      <h2 className="text-2xl font-bold mb-4">Reset Your Password</h2>

      {token && email ? (
        <form onSubmit={handleSubmit} className="text-left">
          <div className="mb-4">
            <label className="font-semibold">New Password:</label>
            <input
              type="password"
              placeholder="New Password"
              className="w-full border p-2 mt-1 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="mb-4">
            <label className="font-semibold">Confirm Password:</label>
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full border p-2 mt-1 rounded"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-2 rounded"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      ) : (
        <p className="text-red-600">Invalid or missing reset token.</p>
      )}

      {message && <p className="mt-4 font-medium">{message}</p>}
    </div>
  );
}
