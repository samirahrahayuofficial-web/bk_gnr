import { Student } from '../types/database';
import { rawStudentsXII } from './rawStudentsData';
import { rawStudentsX } from './rawStudentsDataX';
import { rawStudentsXI } from './rawStudentsDataXI';

// Convert compact tuples [nis, name, gender, class_id] into Student objects
const createStudentsFromTuples = (): Student[] => {
  const allTuples = [...rawStudentsX, ...rawStudentsXI, ...rawStudentsXII];
  return allTuples.map(([nis, name, gender, class_id]) => ({
    id: `std-${nis}`,
    nis,
    nisn: nis,
    name,
    gender,
    class_id,
    phone: '0',
    parent_name: 'Orang Tua / Wali',
    parent_phone: '0',
    address: 'Kabupaten Sukabumi',
    created_at: '2024-07-15',
    updated_at: '2024-07-15',
  }));
};

export const initialStudents: Student[] = createStudentsFromTuples();
