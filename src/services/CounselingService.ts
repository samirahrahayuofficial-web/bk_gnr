import { db } from '../db/storage';
import { CounselingNote, FollowUp, FollowUpStatus, BKServiceType } from '../types/database';

export class CounselingService {
  // Follow-ups (Tindak Lanjut)
  public static getAllFollowUps(): FollowUp[] {
    return db.getFollowUps().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public static getFollowUpsByStudent(studentId: string): FollowUp[] {
    return db
      .getFollowUps()
      .filter((f) => f.student_id === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public static saveFollowUp(followUp: FollowUp): void {
    db.saveFollowUp(followUp);
  }

  public static deleteFollowUp(id: string): void {
    db.deleteFollowUp(id);
  }

  public static updateFollowUpStatus(id: string, status: FollowUpStatus): void {
    const item = db.getFollowUps().find((f) => f.id === id);
    if (item) {
      item.status = status;
      item.updated_at = new Date().toISOString();
      db.saveFollowUp(item);
    }
  }

  // Counseling Notes (Catatan Konseling Rahasia)
  public static getAllCounselingNotes(): CounselingNote[] {
    return db
      .getCounselingNotes()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public static getCounselingNotesByStudent(studentId: string): CounselingNote[] {
    return db
      .getCounselingNotes()
      .filter((c) => c.student_id === studentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public static saveCounselingNote(note: CounselingNote): void {
    db.saveCounselingNote(note);
  }

  public static deleteCounselingNote(id: string): void {
    db.deleteCounselingNote(id);
  }
}
