import Dexie, { type EntityTable } from 'dexie';
import type { CVFormValues } from '../schema/cvSchema';

export interface CVDocument {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  data: CVFormValues;
  originalPdfBuffer?: ArrayBuffer;
}

const db = new Dexie('cv_builder_db') as Dexie & {
  cvs: EntityTable<CVDocument, 'id'>;
};

db.version(1).stores({
  cvs: 'id, title, createdAt, updatedAt'
});

export { db };
