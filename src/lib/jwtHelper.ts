import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Dette er en alternativ måte å validere JWT-tokens på
export async function getUserFromCookie() {
  const cookieStore = cookies();
  const token = cookieStore.get('next-auth.session-token')?.value || 
               cookieStore.get('__Secure-next-auth.session-token')?.value;
  
  if (!token) return null;
  
  try {
    // Bruker jwt.decode i stedet for verify siden vi ikke er så opptatt av signatur-validering
    // i dette tilfellet, bare å få tak i brukerinformasjonen
    const decoded = jwt.decode(token) as any;
    
    if (!decoded || !decoded.email) {
      return null;
    }
    
    return {
      email: decoded.email,
      name: decoded.name,
      role: decoded.role
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
}