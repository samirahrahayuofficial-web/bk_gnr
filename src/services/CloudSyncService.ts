import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { firestore } from '../db/firebase';
import {
  QuestionnaireResponse,
  QuestionnaireAnswer,
  FollowUp,
  CounselingNote,
  Student,
  User,
  ClassRoom,
  StudyProgram,
  SystemSettings,
} from '../types/database';

export class CloudSyncService {
  private static isInitialized = false;
  private static unsubscribers: (() => void)[] = [];
  public static isConnected = false;
  public static lastSyncedAt: string | null = null;

  public static async initCloudSync(onSyncCallback?: () => void): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // 1. Setup real-time listener for Responses (Hasil Pengisian Siswa)
      const responsesCol = collection(firestore, 'responses');
      const unsubResponses = onSnapshot(
        responsesCol,
        (snapshot) => {
          this.isConnected = true;
          this.lastSyncedAt = new Date().toISOString();

          const cloudResponses: QuestionnaireResponse[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as QuestionnaireResponse;
            if (data && data.id) {
              cloudResponses.push(data);
            }
          });

          // Always set local storage to mirror Cloud Firestore authoritative data
          // if cloud has items, or if synced before
          if (!snapshot.empty) {
            localStorage.setItem('sibks_responses_v2', JSON.stringify(cloudResponses));
          } else {
            // Check if we have local submitted responses to push to clean cloud
            const local = JSON.parse(localStorage.getItem('sibks_responses_v2') || '[]') as QuestionnaireResponse[];
            if (local.length > 0 && !localStorage.getItem('sibks_cloud_seeded_v3')) {
              this.pushInitialLocalResponsesToCloud();
              localStorage.setItem('sibks_cloud_seeded_v3', 'true');
            }
          }

          if (onSyncCallback) onSyncCallback();
          window.dispatchEvent(new CustomEvent('sibks_data_synced'));
        },
        (error) => {
          console.error('Firestore responses listener error:', error);
        }
      );
      this.unsubscribers.push(unsubResponses);

      // 2. Setup real-time listener for Answers (Jawaban Butir Siswa)
      const answersCol = collection(firestore, 'answers');
      const unsubAnswers = onSnapshot(
        answersCol,
        (snapshot) => {
          const cloudAnswers: QuestionnaireAnswer[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as QuestionnaireAnswer;
            if (data && data.id) {
              cloudAnswers.push(data);
            }
          });

          if (!snapshot.empty) {
            localStorage.setItem('sibks_answers_v2', JSON.stringify(cloudAnswers));
          }

          if (onSyncCallback) onSyncCallback();
          window.dispatchEvent(new CustomEvent('sibks_data_synced'));
        },
        (error) => {
          console.error('Firestore answers listener error:', error);
        }
      );
      this.unsubscribers.push(unsubAnswers);

      // 3. Setup real-time listener for Follow-ups (Tindak Lanjut BK)
      const followUpsCol = collection(firestore, 'follow_ups');
      const unsubFollowUps = onSnapshot(
        followUpsCol,
        (snapshot) => {
          const cloudList: FollowUp[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as FollowUp;
            if (data && data.id) {
              cloudList.push(data);
            }
          });

          if (!snapshot.empty) {
            localStorage.setItem('sibks_follow_ups_v2', JSON.stringify(cloudList));
          }

          if (onSyncCallback) onSyncCallback();
          window.dispatchEvent(new CustomEvent('sibks_data_synced'));
        },
        (error) => {
          console.error('Firestore follow_ups listener error:', error);
        }
      );
      this.unsubscribers.push(unsubFollowUps);

      // 4. Setup real-time listener for Counseling Notes (Catatan Konseling)
      const notesCol = collection(firestore, 'counseling_notes');
      const unsubNotes = onSnapshot(
        notesCol,
        (snapshot) => {
          const cloudList: CounselingNote[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as CounselingNote;
            if (data && data.id) {
              cloudList.push(data);
            }
          });

          if (!snapshot.empty) {
            localStorage.setItem('sibks_counseling_notes_v2', JSON.stringify(cloudList));
          }

          if (onSyncCallback) onSyncCallback();
          window.dispatchEvent(new CustomEvent('sibks_data_synced'));
        },
        (error) => {
          console.error('Firestore notes listener error:', error);
        }
      );
      this.unsubscribers.push(unsubNotes);

      console.log('SIBKS Multi-Device Cloud Firestore Synchronizer Active and Connected!');
    } catch (err) {
      console.error('Failed to initialize cloud sync listeners', err);
    }
  }

  // Push individual response to Firestore
  public static async syncResponseToCloud(resp: QuestionnaireResponse): Promise<void> {
    try {
      const docRef = doc(firestore, 'responses', resp.id);
      await setDoc(docRef, resp, { merge: true });
    } catch (e) {
      console.error('Failed to push response to cloud', e);
    }
  }

  // Delete response from Firestore (for Reset)
  public static async deleteResponseFromCloud(responseId: string): Promise<void> {
    try {
      const docRef = doc(firestore, 'responses', responseId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Failed to delete response from cloud', e);
    }
  }

  // Sync answers to Firestore in batch
  public static async syncAnswersToCloud(answers: QuestionnaireAnswer[]): Promise<void> {
    if (!answers || answers.length === 0) return;
    try {
      const batch = writeBatch(firestore);
      answers.forEach((ans) => {
        const docRef = doc(firestore, 'answers', ans.id);
        batch.set(docRef, ans, { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.error('Failed to push answers batch to cloud', e);
    }
  }

  // Delete answers from Firestore
  public static async deleteAnswersByResponseIdFromCloud(responseId: string): Promise<void> {
    try {
      const answersCol = collection(firestore, 'answers');
      const snap = await getDocs(answersCol);
      const batch = writeBatch(firestore);
      let count = 0;
      snap.forEach((d) => {
        const data = d.data() as QuestionnaireAnswer;
        if (data.response_id === responseId) {
          batch.delete(d.ref);
          count++;
        }
      });
      if (count > 0) {
        await batch.commit();
      }
    } catch (e) {
      console.error('Failed to delete answers from cloud', e);
    }
  }

  // Sync FollowUp
  public static async syncFollowUpToCloud(fu: FollowUp): Promise<void> {
    try {
      const docRef = doc(firestore, 'follow_ups', fu.id);
      await setDoc(docRef, fu, { merge: true });
    } catch (e) {
      console.error('Failed to push follow up to cloud', e);
    }
  }

  public static async deleteFollowUpFromCloud(id: string): Promise<void> {
    try {
      const docRef = doc(firestore, 'follow_ups', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Failed to delete follow up from cloud', e);
    }
  }

  // Sync Counseling Note
  public static async syncCounselingNoteToCloud(note: CounselingNote): Promise<void> {
    try {
      const docRef = doc(firestore, 'counseling_notes', note.id);
      await setDoc(docRef, note, { merge: true });
    } catch (e) {
      console.error('Failed to push counseling note to cloud', e);
    }
  }

  public static async deleteCounselingNoteFromCloud(id: string): Promise<void> {
    try {
      const docRef = doc(firestore, 'counseling_notes', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Failed to delete counseling note from cloud', e);
    }
  }

  // Helper to push initial local responses to cloud
  private static async pushInitialLocalResponsesToCloud(): Promise<void> {
    try {
      const localResp = JSON.parse(localStorage.getItem('sibks_responses_v2') || '[]') as QuestionnaireResponse[];
      const localAns = JSON.parse(localStorage.getItem('sibks_answers_v2') || '[]') as QuestionnaireAnswer[];

      if (localResp.length > 0) {
        for (const r of localResp) {
          await this.syncResponseToCloud(r);
        }
      }
      if (localAns.length > 0) {
        await this.syncAnswersToCloud(localAns);
      }
    } catch (e) {
      console.error('Failed to push initial local data to cloud', e);
    }
  }
}
