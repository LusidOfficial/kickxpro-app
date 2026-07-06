import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { amount, currency, eventId, notes } = await req.json();

    // The amount comes in as standard currency (e.g. 500 for ₹500), Razorpay expects paise.
    const amountInPaise = amount * 100;

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
    });

    const options = {
      amount: amountInPaise,
      currency: currency || "INR",
      receipt: `receipt_order_${eventId}_${Date.now()}`,
      notes: notes || {},
    };

    const order = await instance.orders.create(options);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
