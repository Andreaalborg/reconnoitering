// src/app/api/newsletter/unsubscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Newsletter from '@/models/Newsletter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Unsubscribe token is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find subscription by token
    const subscription = await Newsletter.findOne({ 
      unsubscribeToken: token,
      status: 'subscribed'
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Invalid unsubscribe token or already unsubscribed' },
        { status: 400 }
      );
    }

    // Unsubscribe
    subscription.status = 'unsubscribed';
    subscription.unsubscribeDate = new Date();
    await subscription.save();

    // Redirect to unsubscribe success page
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/newsletter/unsubscribed`);

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/newsletter/error`);
  }
}

// POST method for unsubscribe via form
export async function POST(request: NextRequest) {
  try {
    const { email, reason } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find subscription by email
    const subscription = await Newsletter.findOne({ 
      email: email.toLowerCase(),
      status: 'subscribed'
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Email not found in our newsletter list' },
        { status: 404 }
      );
    }

    // Unsubscribe
    subscription.status = 'unsubscribed';
    subscription.unsubscribeDate = new Date();
    await subscription.save();

    // Log unsubscribe reason (optional)
    if (reason) {
      console.log(`Unsubscribe reason from ${email}: ${reason}`);
    }

    return NextResponse.json({
      success: true,
      message: 'You have been successfully unsubscribed from our newsletter.'
    });

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe. Please try again later.' },
      { status: 500 }
    );
  }
}