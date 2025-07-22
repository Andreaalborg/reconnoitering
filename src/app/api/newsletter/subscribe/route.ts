// src/app/api/newsletter/subscribe/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Newsletter from '@/models/Newsletter';
import { validateEmail } from '@/utils/validation';
import { sendEmail } from '@/services/email';
import { checkRateLimit } from '@/utils/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const { email, source = 'footer' } = await request.json();

    // Validate email
    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Rate limiting - 5 subscriptions per hour per IP
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const rateLimitKey = `newsletter:${clientIp}`;
    const { allowed, retryAfter } = await checkRateLimit(rateLimitKey, 5, 3600);

    if (!allowed) {
      return NextResponse.json(
        { 
          error: 'Too many subscription attempts. Please try again later.',
          retryAfter 
        },
        { status: 429 }
      );
    }

    await dbConnect();

    // Check if email already exists
    const existingSubscription = await Newsletter.findOne({ email: email.toLowerCase() });

    if (existingSubscription) {
      if (existingSubscription.status === 'subscribed') {
        return NextResponse.json(
          { error: 'This email is already subscribed to our newsletter' },
          { status: 409 }
        );
      } else if (existingSubscription.status === 'unsubscribed') {
        // Re-subscribe them
        existingSubscription.status = 'pending';
        existingSubscription.subscriptionDate = new Date();
        await existingSubscription.save();

        // Send confirmation email
        await sendConfirmationEmail(existingSubscription);

        return NextResponse.json({
          success: true,
          message: 'Welcome back! Please check your email to confirm your subscription.',
          requiresConfirmation: true
        });
      }
    } else {
      // Create new subscription
      const subscription = await Newsletter.create({
        email: email.toLowerCase().trim(),
        status: 'pending',
        source,
        ipAddress: clientIp,
      });

      // Send confirmation email
      await sendConfirmationEmail(subscription);
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing! Please check your email to confirm your subscription.',
      requiresConfirmation: true
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe. Please try again later.' },
      { status: 500 }
    );
  }
}

async function sendConfirmationEmail(subscription: any) {
  const confirmUrl = `${process.env.NEXTAUTH_URL}/newsletter/confirm?token=${subscription.unsubscribeToken}`;
  
  await sendEmail({
    to: subscription.email,
    subject: 'Confirm your Reconnoitering newsletter subscription',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e11d48;">Welcome to Reconnoitering!</h2>
        <p>Thank you for subscribing to our newsletter. You're almost there!</p>
        <p>Please confirm your subscription by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmUrl}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Confirm Subscription
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${confirmUrl}</p>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <p><strong>What to expect:</strong></p>
          <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
            <li>Weekly roundups of new art exhibitions</li>
            <li>Exclusive previews and behind-the-scenes content</li>
            <li>Art event recommendations based on your interests</li>
            <li>No spam, ever. Unsubscribe anytime.</li>
          </ul>
        </div>
        <hr style="border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #9ca3af; font-size: 14px;">
          Reconnoitering - Discover Art Exhibitions<br>
          If you didn't sign up for this newsletter, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}