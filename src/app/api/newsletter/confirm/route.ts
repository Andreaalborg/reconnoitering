// src/app/api/newsletter/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Newsletter from '@/models/Newsletter';
import { sendEmail } from '@/services/email';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Confirmation token is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find subscription by token
    const subscription = await Newsletter.findOne({ 
      unsubscribeToken: token,
      status: 'pending'
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Invalid or expired confirmation token' },
        { status: 400 }
      );
    }

    // Confirm subscription
    subscription.status = 'subscribed';
    subscription.subscriptionDate = new Date();
    await subscription.save();

    // Send welcome email
    await sendEmail({
      to: subscription.email,
      subject: 'Welcome to the Reconnoitering newsletter!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e11d48;">Welcome to Reconnoitering!</h2>
          <p>Your subscription has been confirmed. Thank you for joining our community of art enthusiasts!</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p><strong>Here's what you can expect:</strong></p>
            <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
              <li>Weekly highlights of new and upcoming exhibitions</li>
              <li>Curated recommendations based on trending art</li>
              <li>Exclusive interviews with artists and curators</li>
              <li>Early access to special events and exhibitions</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}" style="background-color: #e11d48; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Explore Exhibitions
            </a>
          </div>

          <p>Your first newsletter will arrive within the next few days. In the meantime, feel free to explore our website and discover amazing exhibitions happening near you.</p>
          
          <hr style="border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 14px;">
            Reconnoitering - Discover Art Exhibitions<br>
            <a href="${process.env.NEXTAUTH_URL}/newsletter/unsubscribe?token=${subscription.unsubscribeToken}" style="color: #9ca3af;">Unsubscribe</a> | 
            <a href="${process.env.NEXTAUTH_URL}/newsletter/preferences?token=${subscription.unsubscribeToken}" style="color: #9ca3af;">Update preferences</a>
          </p>
        </div>
      `,
    });

    // Redirect to success page instead of returning JSON
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/newsletter/confirmed`);

  } catch (error) {
    console.error('Newsletter confirmation error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/newsletter/error`);
  }
}