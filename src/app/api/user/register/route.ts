import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const { name, email, password } = body;
    
    // Sjekk om brukeren allerede eksisterer
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash passordet
    // const hashedPassword = await bcrypt.hash(password, 10);
    
    // For enkel testing, bruker vi ikke hashing enda
    const hashedPassword = password;
    
    // Opprett brukeren
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });
    
    // Returner bruker uten passord
    const userWithoutPassword = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    return NextResponse.json({ 
      success: true, 
      data: userWithoutPassword 
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register user' },
      { status: 500 }
    );
  }
}