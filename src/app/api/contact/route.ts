// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Contact from '@/models/Contact';
import { validateEmail } from '@/utils/validation';
import { sendEmail } from '@/services/email';
import { checkRateLimit } from '@/utils/rateLimit';

// Spam protection: honeypot field and content filtering
const SPAM_KEYWORDS = [
  'viagra', 'cialis', 'casino', 'lottery', 'prince', 'inheritance',
  'click here', 'buy now', 'limited time', 'act now'
];

function containsSpam(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SPAM_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message, website } = body; // website is honeypot

    // Honeypot check - if website field is filled, it's likely a bot
    if (website) {
      console.log('Honeypot triggered - potential spam');
      // Return success to not alert spammers
      return NextResponse.json({ 
        success: true, 
        message: 'Thank you for your message. We will get back to you soon.' 
      });
    }

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Length validation
    if (name.length > 100 || subject.length > 200 || message.length > 5000) {
      return NextResponse.json(
        { error: 'Input exceeds maximum length' },
        { status: 400 }
      );
    }

    // Spam content check
    if (containsSpam(subject) || containsSpam(message)) {
      console.log('Spam content detected');
      // Return success to not alert spammers
      return NextResponse.json({ 
        success: true, 
        message: 'Thank you for your message. We will get back to you soon.' 
      });
    }

    // Rate limiting - 3 submissions per hour per IP
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    const rateLimitKey = `contact:${clientIp}`;
    const { allowed, retryAfter } = await checkRateLimit(rateLimitKey, 3, 3600);

    if (!allowed) {
      return NextResponse.json(
        { 
          error: 'Too many submissions. Please try again later.',
          retryAfter 
        },
        { status: 429 }
      );
    }

    await dbConnect();

    // Save to database
    const contact = await Contact.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      subject: subject.trim(),
      message: message.trim(),
      ipAddress: clientIp,
      userAgent: request.headers.get('user-agent') || 'unknown',
      source: request.headers.get('referer') || 'direct'
    });

    // Send notification email to admin
    await sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@reconnoitering.art',
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e11d48;">New Contact Form Submission</h2>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong></p>
            <div style="background-color: white; padding: 15px; border-radius: 4px; margin-top: 10px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
              Submitted on: ${new Date().toLocaleString()}<br>
              Contact ID: ${contact._id}
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px;">
            <a href="${process.env.NEXTAUTH_URL}/admin/contacts/${contact._id}" 
               style="background-color: #e11d48; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View in Admin Panel
            </a>
          </div>
        </div>
      `,
    });

    // Send confirmation email to user
    await sendEmail({
      to: email,
      subject: 'Thank you for contacting Reconnoitering',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e11d48;">Thank you for reaching out!</h2>
          <p>Hi ${name},</p>
          <p>We've received your message and will get back to you as soon as possible.</p>
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Your message:</strong></p>
            <p style="color: #6b7280;">${message}</p>
          </div>
          <p>If you have any urgent questions, please don't hesitate to reach out again.</p>
          <hr style="border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #9ca3af; font-size: 14px;">
            Reconnoitering - Discover Art Exhibitions<br>
            This is an automated response. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon.',
      contactId: contact._id
    });

  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form. Please try again later.' },
      { status: 500 }
    );
  }
}

// GET method to retrieve contacts (admin only)
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    await dbConnect();

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Contact.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve contacts' },
      { status: 500 }
    );
  }
}