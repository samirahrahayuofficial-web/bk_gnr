import { db } from '../db/storage';
import { ClassRoom, Student, StudyProgram } from '../types/database';

export class StudentService {
  public static getAllStudents(): Student[] {
    return db.getStudents();
  }

  public static getStudentById(id: string): Student | undefined {
    return db.getStudents().find((s) => s.id === id);
  }

  public static getStudentsByClass(classId: string): Student[] {
    return db.getStudents().filter((s) => s.class_id === classId);
  }

  public static searchStudents(query: string, classId?: string, studyProgramId?: string): Student[] {
    let list = db.getStudents();
    const classes = db.getClasses();

    if (classId) {
      list = list.filter((s) => s.class_id === classId);
    }

    if (studyProgramId) {
      const validClassIds = new Set(
        classes.filter((c) => c.study_program_id === studyProgramId).map((c) => c.id)
      );
      list = list.filter((s) => validClassIds.has(s.class_id));
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nis.toLowerCase().includes(q) ||
          s.nisn.toLowerCase().includes(q)
      );
    }

    return list;
  }

  public static saveStudent(student: Student): void {
    db.saveStudent(student);
  }

  public static deleteStudent(id: string): void {
    db.deleteStudent(id);
  }

  public static getStudentFullInfo(studentId: string) {
    const student = this.getStudentById(studentId);
    if (!student) return null;

    const studentClass = db.getClasses().find((c) => c.id === student.class_id);
    const studyProgram = studentClass
      ? db.getPrograms().find((p) => p.id === studentClass.study_program_id)
      : undefined;

    return {
      student,
      studentClass,
      studyProgram,
    };
  }
}
