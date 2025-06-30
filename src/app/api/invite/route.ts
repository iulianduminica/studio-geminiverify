
import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { nanoid } from 'nanoid';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];

    if (idToken === 'dev-token') {
      const uniqueKey = nanoid(8);
      const newInviteId = `dev-invite-${uniqueKey}`;
      return NextResponse.json({ success: true, inviteId: newInviteId }, { status: 200 });
    }

    if (!adminAuth || !adminDb) {
      throw new Error('Firebase Admin SDK not initialized. Check server environment variables.');
    }
    
    const db = adminDb;
    const auth = adminAuth;

    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid } = decodedToken;
    const userDocRef = db.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();
    if (!userDocSnap.exists || !userDocSnap.data()?.isAdmin) {
      return NextResponse.json({ message: 'Forbidden: User is not an admin.' }, { status: 403 });
    }

    // A unique key is generated for the new invite.
    const uniqueKey = nanoid(8);
    const newInviteId = `invite-${uniqueKey}`;
    const inviteDocRef = db.collection('invites').doc(newInviteId);
    
    // Create a document in the 'invites' collection to track it.
    // This document only contains metadata about the invite itself.
    await inviteDocRef.set({
      generatedBy: uid,
      generatedAt: FieldValue.serverTimestamp(),
      status: 'pending', // Status can be 'pending', 'claimed', or 'expired'.
    });

    return NextResponse.json({ success: true, inviteId: newInviteId }, { status: 200 });

  } catch (error) {
    let errorMessage = 'An unknown error occurred.';
    let errorCode: string | null = null;
    
    if (error instanceof Error) {
        errorMessage = error.message;
        if ('code' in error && typeof (error as {code?: string}).code === 'string') {
            errorCode = (error as {code: string}).code;
        }
    }
    
    console.error('Invite API error:', error);

    if (errorCode === 'auth/id-token-expired') {
        return NextResponse.json({ message: 'Authentication token has expired.' }, { status: 401 });
    }
    
    return NextResponse.json({ message: 'Internal Server Error', error: errorMessage }, { status: 500 });
  }
}
