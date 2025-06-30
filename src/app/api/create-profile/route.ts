
import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { UserProfile, WorkoutPlan } from '@/types/workout';
import { nanoid } from 'nanoid';
import { initialWorkoutData } from '@/data/initial-data';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const db = adminDb;
    const auth = adminAuth;

    if (!auth || !db) {
      throw new Error('Firebase Admin SDK not initialized.');
    }

    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, picture, name } = decodedToken;

    const { profileData, inviteId } = await request.json();
    if (!profileData) {
        return NextResponse.json({ message: 'Missing profile data.' }, { status: 400 });
    }

    const userDocRef = db.collection('users').doc(uid);
    const userDocSnap = await userDocRef.get();
    
    if (userDocSnap.exists) {
        return NextResponse.json({ message: 'User profile already exists.' }, { status: 409 });
    }
    
    const firstName = name?.split(' ')[0] || 'User';
    let assignedWorkoutId = '';
    const isAdminUser = !!(process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL);

    if (inviteId) {
        const inviteDocRef = db.collection('invites').doc(inviteId);

        assignedWorkoutId = await db.runTransaction(async (transaction) => {
            const inviteDoc = await transaction.get(inviteDocRef);

            if (!inviteDoc.exists || inviteDoc.data()?.status !== 'pending') {
                throw new Error('invalid_invite'); 
            }
            
            let newWorkoutId = '';
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 5;

            while (!isUnique && attempts < maxAttempts) {
                attempts++;
                const uniqueKey = nanoid(6);
                const proposedId = `${firstName.toLowerCase().replace(/\s+/g, '-')}-${uniqueKey}`;
                const workoutDocRef = db.collection('workouts').doc(proposedId);
                const docSnap = await transaction.get(workoutDocRef);
                if (!docSnap.exists) {
                    newWorkoutId = proposedId;
                    isUnique = true;
                }
            }
            
            if (!isUnique) {
                throw new Error('Could not generate a unique workout ID. Please try again.');
            }

            const newWorkoutDocRef = db.collection('workouts').doc(newWorkoutId);

            const newWorkoutPlanData: WorkoutPlan = {
                ...initialWorkoutData,
                userName: firstName
            };

            transaction.set(newWorkoutDocRef, newWorkoutPlanData);
            transaction.update(inviteDocRef, {
                status: 'claimed',
                claimedByUid: uid,
                claimedByEmail: email,
                claimedAt: FieldValue.serverTimestamp()
            });

            return newWorkoutId;
        });

    } else if (isAdminUser) {
        let newWorkoutId = '';
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 5;

        while (!isUnique && attempts < maxAttempts) {
            attempts++;
            const uniqueKey = nanoid(6);
            const proposedId = `${firstName.toLowerCase().replace(/\s+/g, '-')}-${uniqueKey}`;
            const workoutDocRef = db.collection('workouts').doc(proposedId);
            const docSnap = await workoutDocRef.get();
            if (!docSnap.exists) {
                newWorkoutId = proposedId;
                isUnique = true;
            }
        }

        if (!isUnique) {
            throw new Error('Could not generate a unique workout ID for admin. Please try again.');
        }

        const newWorkoutDocRef = db.collection('workouts').doc(newWorkoutId);
        
        const newWorkoutPlanData: WorkoutPlan = { 
          ...initialWorkoutData, 
          userName: firstName 
        };

        await newWorkoutDocRef.set(newWorkoutPlanData);
        assignedWorkoutId = newWorkoutId;

    } else {
        return NextResponse.json({ code: 'invitation_required', message: 'An invitation is required to sign up.' }, { status: 403 });
    }

    if (!assignedWorkoutId) {
        throw new Error('Workout ID could not be assigned.');
    }

    const [year, month, day] = profileData.dateOfBirth.split('-');

    const userProfileData: UserProfile = { 
        firstName,
        email: email || null,
        photoURL: picture || null,
        dateOfBirth: profileData.dateOfBirth,
        dobDay: day,
        dobMonth: month,
        dobYear: year,
        weight: profileData.weight,
        height: profileData.height,
        gender: profileData.gender,
        workoutId: assignedWorkoutId 
    };
    
    if (isAdminUser) {
        userProfileData.isAdmin = true;
    }

    await userDocRef.set(userProfileData);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    let errorMessage = 'An unexpected error occurred.';
    let errorCode: string | null = null;
    
    if (error instanceof Error) {
        errorMessage = error.message;
        if (errorMessage === 'invalid_invite') {
            return NextResponse.json({ code: 'invalid_invite', message: 'This invitation is invalid or has already been used.' }, { status: 400 });
        }
        if ('code' in error && typeof (error as {code?: string}).code === 'string') {
            errorCode = (error as {code: string}).code;
        }
    }
    
    console.error('Create Profile API error:', error);
    
    if (errorCode === 'auth/id-token-expired') {
        return NextResponse.json({ message: 'Authentication token has expired.' }, { status: 401 });
    }
    if (errorCode === 'permission-denied' || (error instanceof Error && error.message.includes('permission-denied'))) {
        return NextResponse.json({ message: 'Firestore permission denied. Check your rules.' }, { status: 403 });
    }
    
    return NextResponse.json({ message: `Internal Server Error: ${errorMessage}` }, { status: 500 });
  }
}
