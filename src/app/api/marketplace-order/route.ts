/* ──────────────────────────────────────────────
   MARKETPLACE ORDER API — Creates a Razorpay
   order for KickX Coin purchases.
   ────────────────────────────────────────────── */
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  try {
    const { amount, packName, userId } = await req.json();

    if (!amount || !packName) {
      return NextResponse.json({ error: 'Missing amount or packName' }, { status: 400 });
    }

    // Amount comes in as standard currency (e.g. 499 for ₹499), Razorpay expects paise.
    const amountInPaise = Math.round(amount * 100);

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
    });

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `kxc_${packName}_${userId || 'guest'}_${Date.now()}`,
      notes: {
        type: 'kxc_topup',
        pack_name: packName,
        user_id: userId || '',
      },
    };

    const order = await instance.orders.create(options);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error creating marketplace order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
