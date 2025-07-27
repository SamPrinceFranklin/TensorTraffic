
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface PoliceAlertData {
    childName: string;
    schoolName: string;
    overdueDuration: string;
    timeLeftSchool: string;
    schoolContact: string;
    homeLocation: { lat: number; lng: number };
    schoolLocation: { lat: number; lng: number };
}

export async function savePoliceAlert(alertData: PoliceAlertData) {
    try {
        const docRef = await addDoc(collection(db, "policeAlerts"), {
            ...alertData,
            timestamp: serverTimestamp(),
        });
        console.log("Police alert document written with ID: ", docRef.id);
        return { success: true, id: docRef.id };
    } catch (e) {
        console.error("Error adding police alert document: ", e);
        if (e instanceof Error) {
            if (e.message.includes('PERMISSION_DENIED')) {
                 return { success: false, error: 'Permission Denied. Please check your Firestore security rules to allow writing to the policeAlerts collection.' };
            }
            return { success: false, error: e.message };
        }
        return { success: false, error: 'An unknown error occurred while saving the police alert.' };
    }
}
