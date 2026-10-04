import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import { firestore } from '../db/firebase';
import {
  QuestionnaireResponse,
  QuestionnaireAnswer,
  FollowUp,
  CounselingNote,
  Student,
  User,
  Teacher,
  ClassRoom,
  StudyProgram,
  SystemSettings,
  AcademicYear,
  QuestionnaireAssignment,
  QuestionnaireCategory,
  QuestionnaireQuestion,
  AuditLog,
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
      // 1. Settings (Tahun Ajar Aktif, Info Sekolah, Ambang Batas)
      const settingsDoc = doc(firestore, 'settings', 'main');
      const unsubSettings = onSnapshot(
        settingsDoc,
        (snap) => {
          this.isConnected = true;
          this.lastSyncedAt = new Date().toISOString();
          if (snap.exists()) {
            const data = snap.data() as SystemSettings;
            if (data && data.school_name) {
              localStorage.setItem('sibks_settings_v2', JSON.stringify(data));
              if (onSyncCallback) onSyncCallback();
              window.dispatchEvent(new CustomEvent('sibks_data_synced'));
            }
          } else {
            // First time seed settings to cloud
            const local = JSON.parse(localStorage.getItem('sibks_settings_v2') || '{}');
            if (local.school_name) {
              this.syncSettingsToCloud(local);
            }
          }
        },
        (err) => console.error('Settings listener error:', err)
      );
      this.unsubscribers.push(unsubSettings);

      // 2. Users (Data Pengguna / Akun Sistem)
      const usersCol = collection(firestore, 'users');
      const unsubUsers = onSnapshot(
        usersCol,
        (snap) => {
          if (!snap.empty) {
            const cloudUsers: User[] = [];
            snap.forEach((d) => {
              const data = d.data() as User;
              if (data && data.id) cloudUsers.push(data);
            });
            localStorage.setItem('sibks_users_v2', JSON.stringify(cloudUsers));
            if (onSyncCallback) onSyncCallback();
            window.dispatchEvent(new CustomEvent('sibks_data_synced'));
          } else {
            // Seed local users to cloud if empty
            const local = JSON.parse(localStorage.getItem('sibks_users_v2') || '[]');
            if (local.length > 0) {
              this.syncAllUsersToCloud(local);
            }
          }
        },
        (err) => console.error('Users listener error:', err)
      );
      this.unsubscribers.push(unsubUsers);

      // 3. Teachers (Data Guru BK)
      const teachersCol = collection(firestore, 'teachers');
      const unsubTeachers = onSnapshot(
        teachersCol,
        (snap) => {
          if (!snap.empty) {
            const cloudTeachers: Teacher[] = [];
            snap.forEach((d) => {
              const data = d.data() as Teacher;
              if (data && data.id) cloudTeachers.push(data);
            });
            localStorage.setItem('sibks_teachers_v2', JSON.stringify(cloudTeachers));
            if (onSyncCallback) onSyncCallback();
            window.dispatchEvent(new CustomEvent('sibks_data_synced'));
          }
        },
        (err) => console.error('Teachers listener error:', err)
      );
      this.unsubscribers.push(unsubTeachers);

      // 4. Academic Years (Daftar Tahun Ajaran)
      const ayCol = collection(firestore, 'academic_years');
      const unsubAy = onSnapshot(
        ayCol,
        (snap) => {
          if (!snap.empty) {
            const cloudAy: AcademicYear[] = [];
            snap.forEach((d) => {
              const data = d.data() as AcademicYear;
              if (data && data.id) cloudAy.push(data);
            });
            localStorage.setItem('sibks_academic_years_v2', JSON.stringify(cloudAy));
            if (onSyncCallback) onSyncCallback();
            window.dispatchEvent(new CustomEvent('sibks_data_synced'));
          } else {
            // First time seed academic years to cloud
            const local = JSON.parse(localStorage.getItem('sibks_academic_years_v2') || '[]');
            if (local.length > 0) {
              this.syncAllAcademicYearsToCloud(local);
            }
          }
        },
        (err) => console.error('Academic years listener error:', err)
      );
      this.unsubscribers.push(unsubAy);

      // 5. Students (Data Siswa)
      const studentsCol = collection(firestore, 'students');
      const unsubStudents = onSnapshot(
        studentsCol,
        (snap) => {
          const cloudStudents: Student[] = [];
          if (!snap.empty) {
            snap.forEach((d) => {
              const data = d.data() as Student;
              if (data && data.id) cloudStudents.push(data);
            });
          }
          localStorage.setItem('sibks_students_v2', JSON.stringify(cloudStudents));
          if (onSyncCallback) onSyncCallback();
          window.dispatchEvent(new CustomEvent('sibks_data_synced'));
        },
        (err) => console.error('Students listener error:', err)
      );
      this.unsubscribers.push(unsubStudents);

      // 6. Classes (Data Rombel Kelas)
      const classesCol = collection(firestore, 'classes');
      const unsubClasses = onSnapshot(
        classesCol,
        (snap) => {
          if (!snap.empty) {
            const cloudClasses: ClassRoom[] = [];
            snap.forEach((d) => {
              const data = d.data() as ClassRoom;
              if (data && data.id) cloudClasses.push(data);
            });
            localStorage.setItem('sibks_classes_v2', JSON.stringify(cloudClasses));
            if (onSyncCallback) onSyncCallback();
            window.dispatchEvent(new CustomEvent('sibks_data_synced'));
          } else {
            const local = JSON.parse(localStorage.getItem('sibks_classes_v2') || '[]');
            if (local.length > 0) {
              this.syncAllClassesToCloud(local);
            }
          }
        },
        (err) => console.error('Classes listener error:', err)
      );
      this.unsubscribers.push(unsubClasses);

      // 7. Study Programs (Program Keahlian)
      const programsCol = collection(firestore, 'programs');
      const unsubPrograms = onSnapshot(
        programsCol,
        (snap) => {
          if (!snap.empty) {
            const cloudPrograms: StudyProgram[] = [];
            snap.forEach((d) => {
              const data = d.data() as StudyProgram;
              if (data && data.id) cloudPrograms.push(data);
            });
            localStorage.setItem('sibks_programs_v2', JSON.stringify(cloudPrograms));
            if (onSyncCallback) onSyncCallback();
            window.dispatchEvent(new CustomEvent('sibks_data_synced'));
          }
        },
        (err) => console.error('Programs listener error:', err)
      );
      this.unsubscribers.push(unsubPrograms);

      // 8. Assignments (Penugasan Angket)
      const assignmentsCol = collection(firestore, 'assignments');
      const unsubAssignments = onSnapshot(
        assignmentsCol,
        (snap) => {
          if (!snap.empty) {
            const cloudAssignments: QuestionnaireAssignment[] = [];
            snap.forEach((d) => {
              const data = d.data() as QuestionnaireAssignment;
              if (data && data.id) cloudAssignments.push(data);
            });
            localStorage.setItem('sibks_assignments_v2', JSON.stringify(cloudAssignments));
            if (onSyncCallback) onSyncCallback();
            window.dispatchEvent(new CustomEvent('sibks_data_synced'));
          }
        },
        (err) => console.error('Assignments listener error:', err)
      );
      this.unsubscribers.push(unsubAssignments);

      // 9. Responses (Hasil Pengisian Siswa)
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

          // Non-destructive merge: preserve local drafts and newer responses
          const localResponses: QuestionnaireResponse[] = JSON.parse(
            localStorage.getItem('sibks_responses_v2') || '[]'
          );
          const responseMap = new Map<string, QuestionnaireResponse>();
          
          // Seed with cloud responses
          cloudResponses.forEach((r) => responseMap.set(r.id, r));

          // Retain local responses that are drafts or newer than cloud
          localResponses.forEach((lr) => {
            const cr = responseMap.get(lr.id);
            if (!cr) {
              responseMap.set(lr.id, lr);
            } else if (lr.status === 'DRAFT' && cr.status !== 'SUBMITTED') {
              responseMap.set(lr.id, lr);
            }
          });

          localStorage.setItem(
            'sibks_responses_v2',
            JSON.stringify(Array.from(responseMap.values()))
          );

          if (onSyncCallback) onSyncCallback();
          window.dispatchEvent(new CustomEvent('sibks_data_synced'));
        },
        (err) => console.error('Responses listener error:', err)
      );
      this.unsubscribers.push(unsubResponses);

      // 10. Answers (Jawaban Butir Siswa)
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

          // Non-destructive merge for answers
          const localAnswers: QuestionnaireAnswer[] = JSON.parse(
            localStorage.getItem('sibks_answers_v2') || '[]'
          );
          const answerMap = new Map<string, QuestionnaireAnswer>();

          cloudAnswers.forEach((a) => answerMap.set(a.id, a));
          localAnswers.forEach((la) => {
            if (!answerMap.has(la.id)) {
              answerMap.set(la.id, la);
            }
          });

          localStorage.setItem('sibks_answers_v2', JSON.stringify(Array.from(answerMap.values())));

          if (onSyncCallback) onSyncCallback();
          window.dispatchEvent(new CustomEvent('sibks_data_synced'));
        },
        (err) => console.error('Answers listener error:', err)
      );
      this.unsubscribers.push(unsubAnswers);

      // 11. Follow-ups (Tindak Lanjut BK)
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
        (err) => console.error('Follow_ups listener error:', err)
      );
      this.unsubscribers.push(unsubFollowUps);

      // 12. Counseling Notes (Catatan Konseling)
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
        (err) => console.error('Counseling_notes listener error:', err)
      );
      this.unsubscribers.push(unsubNotes);

      // 13. Audit Logs (Log Aktivitas)
      const auditCol = collection(firestore, 'audit_logs');
      const unsubAudit = onSnapshot(
        auditCol,
        (snapshot) => {
          const cloudList: AuditLog[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as AuditLog;
            if (data && data.id) {
              cloudList.push(data);
            }
          });

          if (!snapshot.empty) {
            // Sort by timestamp desc
            cloudList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            localStorage.setItem('sibks_audit_logs_v2', JSON.stringify(cloudList));
          }

          if (onSyncCallback) onSyncCallback();
          window.dispatchEvent(new CustomEvent('sibks_data_synced'));
        },
        (err) => console.error('Audit_logs listener error:', err)
      );
      this.unsubscribers.push(unsubAudit);

      console.log('SIBKS Multi-Device Cloud Firestore Synchronizer Active and Connected!');
    } catch (err) {
      console.error('Failed to initialize cloud sync listeners', err);
    }
  }

  // --- SETTINGS SYNC ---
  public static async syncSettingsToCloud(settings: SystemSettings): Promise<void> {
    try {
      const docRef = doc(firestore, 'settings', 'main');
      await setDoc(docRef, settings, { merge: true });
    } catch (e) {
      console.error('Failed to sync settings to cloud', e);
    }
  }

  // --- USERS SYNC ---
  public static async syncUserToCloud(user: User): Promise<void> {
    try {
      const docRef = doc(firestore, 'users', user.id);
      await setDoc(docRef, user, { merge: true });
    } catch (e) {
      console.error('Failed to sync user to cloud', e);
    }
  }

  public static async syncAllUsersToCloud(users: User[]): Promise<void> {
    if (!users || users.length === 0) return;
    try {
      const batch = writeBatch(firestore);
      users.forEach((u) => {
        const docRef = doc(firestore, 'users', u.id);
        batch.set(docRef, u, { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.error('Failed to sync all users to cloud', e);
    }
  }

  public static async deleteUserFromCloud(id: string): Promise<void> {
    try {
      const docRef = doc(firestore, 'users', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Failed to delete user from cloud', e);
    }
  }

  // --- TEACHERS SYNC ---
  public static async syncTeacherToCloud(teacher: Teacher): Promise<void> {
    try {
      const docRef = doc(firestore, 'teachers', teacher.id);
      await setDoc(docRef, teacher, { merge: true });
    } catch (e) {
      console.error('Failed to sync teacher to cloud', e);
    }
  }

  // --- ACADEMIC YEARS SYNC ---
  public static async syncAcademicYearToCloud(ay: AcademicYear): Promise<void> {
    try {
      const docRef = doc(firestore, 'academic_years', ay.id);
      await setDoc(docRef, ay, { merge: true });
    } catch (e) {
      console.error('Failed to sync academic year to cloud', e);
    }
  }

  public static async syncAllAcademicYearsToCloud(list: AcademicYear[]): Promise<void> {
    if (!list || list.length === 0) return;
    try {
      const batch = writeBatch(firestore);
      list.forEach((ay) => {
        const docRef = doc(firestore, 'academic_years', ay.id);
        batch.set(docRef, ay, { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.error('Failed to sync all academic years to cloud', e);
    }
  }

  public static async deleteAcademicYearFromCloud(id: string): Promise<void> {
    try {
      const docRef = doc(firestore, 'academic_years', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Failed to delete academic year from cloud', e);
    }
  }

  // --- STUDENTS SYNC ---
  public static async syncStudentToCloud(student: Student): Promise<void> {
    try {
      const docRef = doc(firestore, 'students', student.id);
      await setDoc(docRef, student, { merge: true });
    } catch (e) {
      console.error('Failed to sync student to cloud', e);
    }
  }

  public static async syncAllStudentsToCloud(students: Student[]): Promise<void> {
    if (!students || students.length === 0) return;
    try {
      const CHUNK_SIZE = 400;
      for (let i = 0; i < students.length; i += CHUNK_SIZE) {
        const chunk = students.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(firestore);
        chunk.forEach((s) => {
          const docRef = doc(firestore, 'students', s.id);
          batch.set(docRef, s, { merge: true });
        });
        await batch.commit();
      }
    } catch (e) {
      console.error('Failed to sync all students to cloud', e);
    }
  }

  public static async deleteStudentFromCloud(idOrNis: string): Promise<void> {
    try {
      // Direct doc deletion
      const docRef = doc(firestore, 'students', idOrNis);
      await deleteDoc(docRef);

      // Query any doc where id == idOrNis or nis == idOrNis
      const studentsCol = collection(firestore, 'students');
      const snap = await getDocs(studentsCol);
      if (!snap.empty) {
        const batch = writeBatch(firestore);
        let count = 0;
        snap.forEach((d) => {
          const data = d.data() as Student;
          if (d.id === idOrNis || (data && (data.id === idOrNis || data.nis === idOrNis))) {
            batch.delete(d.ref);
            count++;
          }
        });
        if (count > 0) await batch.commit();
      }

      // Also delete student user doc
      const userDocRef = doc(firestore, 'users', `usr-std-${idOrNis}`);
      await deleteDoc(userDocRef);
    } catch (e) {
      console.error('Failed to delete student from cloud', e);
    }
  }

  public static async deleteStudentsBatchFromCloud(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) return;
    try {
      const idSet = new Set(ids);
      const studentsCol = collection(firestore, 'students');
      const snap = await getDocs(studentsCol);
      if (snap.empty) return;

      const toDeleteRefs: any[] = [];
      snap.forEach((d) => {
        const data = d.data() as Student;
        if (idSet.has(d.id) || (data && (idSet.has(data.id) || idSet.has(data.nis)))) {
          toDeleteRefs.push(d.ref);
        }
      });

      const CHUNK_SIZE = 400;
      for (let i = 0; i < toDeleteRefs.length; i += CHUNK_SIZE) {
        const chunk = toDeleteRefs.slice(i, i + CHUNK_SIZE);
        const batch = writeBatch(firestore);
        chunk.forEach((ref) => {
          batch.delete(ref);
        });
        await batch.commit();
      }
    } catch (e) {
      console.error('Failed to delete students batch from cloud', e);
    }
  }

  public static async deleteAllStudentsFromCloud(): Promise<void> {
    try {
      const studentsCol = collection(firestore, 'students');
      const snap = await getDocs(studentsCol);
      if (!snap.empty) {
        const docs = snap.docs;
        const CHUNK_SIZE = 400;
        for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
          const chunk = docs.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(firestore);
          chunk.forEach((d) => {
            batch.delete(d.ref);
          });
          await batch.commit();
        }
      }

      // Clean student user documents in Firestore
      const usersCol = collection(firestore, 'users');
      const userSnap = await getDocs(query(usersCol, where('role', '==', 'SISWA')));
      if (!userSnap.empty) {
        const userDocs = userSnap.docs;
        const CHUNK_SIZE = 400;
        for (let i = 0; i < userDocs.length; i += CHUNK_SIZE) {
          const chunk = userDocs.slice(i, i + CHUNK_SIZE);
          const batch = writeBatch(firestore);
          chunk.forEach((d) => {
            batch.delete(d.ref);
          });
          await batch.commit();
        }
      }
    } catch (e) {
      console.error('Failed to delete all students from cloud', e);
    }
  }

  // --- CLASSES SYNC ---
  public static async syncClassToCloud(cls: ClassRoom): Promise<void> {
    try {
      const docRef = doc(firestore, 'classes', cls.id);
      await setDoc(docRef, cls, { merge: true });
    } catch (e) {
      console.error('Failed to sync class to cloud', e);
    }
  }

  public static async syncAllClassesToCloud(classes: ClassRoom[]): Promise<void> {
    if (!classes || classes.length === 0) return;
    try {
      const batch = writeBatch(firestore);
      classes.forEach((c) => {
        const docRef = doc(firestore, 'classes', c.id);
        batch.set(docRef, c, { merge: true });
      });
      await batch.commit();
    } catch (e) {
      console.error('Failed to sync all classes to cloud', e);
    }
  }

  public static async deleteClassFromCloud(id: string): Promise<void> {
    try {
      const docRef = doc(firestore, 'classes', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Failed to delete class from cloud', e);
    }
  }

  // --- STUDY PROGRAMS SYNC ---
  public static async syncProgramToCloud(prog: StudyProgram): Promise<void> {
    try {
      const docRef = doc(firestore, 'programs', prog.id);
      await setDoc(docRef, prog, { merge: true });
    } catch (e) {
      console.error('Failed to sync program to cloud', e);
    }
  }

  public static async deleteProgramFromCloud(id: string): Promise<void> {
    try {
      const docRef = doc(firestore, 'programs', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Failed to delete program from cloud', e);
    }
  }

  // --- ASSIGNMENTS SYNC ---
  public static async syncAssignmentToCloud(asg: QuestionnaireAssignment): Promise<void> {
    try {
      const docRef = doc(firestore, 'assignments', asg.id);
      await setDoc(docRef, asg, { merge: true });
    } catch (e) {
      console.error('Failed to sync assignment to cloud', e);
    }
  }

  public static async deleteAssignmentFromCloud(id: string): Promise<void> {
    try {
      const docRef = doc(firestore, 'assignments', id);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Failed to delete assignment from cloud', e);
    }
  }

  // --- RESPONSES SYNC ---
  public static async syncResponseToCloud(resp: QuestionnaireResponse): Promise<void> {
    try {
      const docRef = doc(firestore, 'responses', resp.id);
      await setDoc(docRef, resp, { merge: true });
    } catch (e) {
      console.error('Failed to push response to cloud', e);
    }
  }

  public static async deleteResponseFromCloud(responseId: string): Promise<void> {
    try {
      const docRef = doc(firestore, 'responses', responseId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error('Failed to delete response from cloud', e);
    }
  }

  // --- ANSWERS SYNC ---
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

  // --- FOLLOW UPS SYNC ---
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

  // --- COUNSELING NOTES SYNC ---
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

  // --- AUDIT LOGS SYNC ---
  public static async syncAuditLogToCloud(log: AuditLog): Promise<void> {
    try {
      const docRef = doc(firestore, 'audit_logs', log.id);
      await setDoc(docRef, log, { merge: true });
    } catch (e) {
      console.error('Failed to push audit log to cloud', e);
    }
  }
}
