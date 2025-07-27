
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, serverTimestamp, Timestamp, doc, updateDoc, increment, getDoc, query, orderBy } from "firebase/firestore";
import { Incident, Comment } from '@/lib/types';

export interface IncidentData {
    location: {
        latitude: number;
        longitude: number;
    };
    category: string;
    severity: string;
    summary: string;
    address?: string;
}

export async function saveIncidentReport(incidentData: IncidentData) {
    try {
        const docRef = await addDoc(collection(db, "incidents"), {
            location: incidentData.location,
            category: incidentData.category,
            severity: incidentData.severity,
            summary: incidentData.summary,
            address: incidentData.address || null,
            upvotes: 0,
            timestamp: serverTimestamp(),
        });
        console.log("Document written with ID: ", docRef.id);
        return { success: true, id: docRef.id };
    } catch (e) {
        console.error("Error adding document: ", e);
        if (e instanceof Error) {
            if (e.message.includes('PERMISSION_DENIED')) {
                 return { success: false, error: 'Permission Denied. Please check your Firestore security rules in the Firebase Console. This is a common issue and is required for the app to save data.' };
            }
            return { success: false, error: e.message };
        }
        return { success: false, error: 'An unknown error occurred while saving the incident report.' };
    }
}

export async function getIncidents() {
  try {
    const querySnapshot = await getDocs(collection(db, 'incidents'));
    const incidents: Incident[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Firestore timestamps can be null if the document is not yet fully written to the server.
      // We provide a fallback to the current date.
      const timestamp = (data.timestamp as Timestamp) || Timestamp.now();
      
      return {
        id: doc.id,
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
        },
        category: data.category,
        severity: data.severity,
        summary: data.summary,
        timestamp: timestamp.toDate().toISOString(),
        address: data.address || undefined,
        upvotes: data.upvotes || 0,
      };
    });
    return { success: true, data: incidents };
  } catch (e) {
    console.error("Error getting documents: ", e);
    if (e instanceof Error) {
      if (e.message.includes('PERMISSION_DENIED')) {
        return { success: false, error: 'Permission Denied. Could not retrieve incidents. Please check your Firestore security rules.' };
      }
      return { success: false, error: e.message };
    }
    return { success: false, error: 'An unknown error occurred while fetching incidents.' };
  }
}

export async function upvoteIncident(incidentId: string) {
    try {
        const incidentRef = doc(db, 'incidents', incidentId);
        await updateDoc(incidentRef, {
            upvotes: increment(1)
        });
        const updatedDoc = await getDoc(incidentRef);
        if(updatedDoc.exists()){
            return { success: true, newUpvotes: updatedDoc.data().upvotes };
        }
        return { success: false, error: 'Could not retrieve updated upvote count.' };
    } catch (e: any) {
        console.error("Error upvoting incident: ", e);
        if (e.message.includes('PERMISSION_DENIED')) {
            return { success: false, error: 'Permission Denied. Please check your Firestore security rules to allow incident updates.' };
        }
        return { success: false, error: e.message || 'An unknown error occurred while upvoting.' };
    }
}

export async function addComment(incidentId: string, commentText: string) {
    try {
        const commentsCollectionRef = collection(db, 'incidents', incidentId, 'comments');
        const docRef = await addDoc(commentsCollectionRef, {
            text: commentText,
            author: 'Anonymous', // In a real app, this would be the logged-in user's ID/name
            timestamp: serverTimestamp(),
        });
        return { success: true, id: docRef.id };
    } catch (e: any) {
        console.error("Error adding comment: ", e);
         if (e.message.includes('PERMISSION_DENIED')) {
            return { success: false, error: 'Permission Denied. Please check your Firestore security rules to allow writing to the comments sub-collection.' };
        }
        return { success: false, error: e.message || 'An unknown error occurred while adding the comment.' };
    }
}

export async function getComments(incidentId: string): Promise<{ success: boolean; data?: Comment[], error?: string }> {
    try {
        const commentsCollectionRef = collection(db, 'incidents', incidentId, 'comments');
        const q = query(commentsCollectionRef, orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        const comments: Comment[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            const timestamp = data.timestamp as Timestamp;
            return {
                id: doc.id,
                text: data.text,
                author: data.author,
                timestamp: timestamp ? timestamp.toDate().toISOString() : new Date().toISOString(),
            };
        });
        return { success: true, data: comments };
    } catch (e: any) {
        console.error("Error fetching comments: ", e);
         if (e.message.includes('PERMISSION_DENIED')) {
            return { success: false, error: 'Permission Denied. Please check your Firestore security rules to allow reading from the comments sub-collection.' };
        }
        return { success: false, error: e.message || 'An unknown error occurred while fetching comments.' };
    }
}
