import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with Service Role Key for admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy_key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    console.log("Razorpay Webhook Event Received:", event.event);

    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const payment = event.payload.payment.entity;
      const notes = payment.notes || {};
      
      const userId = notes.user_id;
      const productType = notes.product_type; 
      
      if (userId) {
        if (productType === 'kxc_coins') {
          const kxcAmount = parseInt(notes.kxc_amount, 10);
          
          if (!isNaN(kxcAmount) && kxcAmount > 0) {
            // Fetch current balance
            const { data: walletData } = await supabase
              .from('kickx_wallet')
              .select('balance')
              .eq('user_id', userId)
              .maybeSingle();
              
            const newBalance = (walletData?.balance || 0) + kxcAmount;
            
            await supabase
              .from('kickx_wallet')
              .upsert({ user_id: userId, balance: newBalance });
              
            // Log transaction
            await supabase
              .from('kickx_transactions')
              .insert({
                user_id: userId,
                type: 'topup',
                amount: kxcAmount,
                description: notes.pack_name || 'Coin Top Up',
                reference_id: payment.order_id
              });
          }
        } else if (productType === 'coach_pro_subscription') {
          // Set to Pro and expire in 30 days
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30);
          
          await supabase
            .from('profiles')
            .update({
              subscription_tier: 'pro',
              subscription_status: 'active',
              subscription_end_date: endDate.toISOString()
            })
            .eq('id', userId);
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
