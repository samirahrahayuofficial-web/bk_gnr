import { Student } from '../types/database';
import { studentsX } from './studentsDataX';
import { studentsXI } from './studentsDataXI';
import { studentsXII } from './studentsDataXII';

export const initialStudents: Student[] = [
  ...studentsX,
  ...studentsXI,
  ...studentsXII,
];
