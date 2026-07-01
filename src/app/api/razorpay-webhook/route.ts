import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret_placeholder';

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    
    // In a real application, you would update your Supabase database here based on event.event
    // e.g., if (event.event === 'payment.captured') { await supabase.from('registrations').update({ payment_status: 'completed' }) }

    console.log("Razorpay Webhook Event Received:", event.event);

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
