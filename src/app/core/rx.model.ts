import { newId } from './pad.model';

export type Sex = '' | 'M' | 'F' | 'O';

export interface Patient {
  name: string;
  age: string;
  sex: Sex;
  weight: string;
  phone: string;
  id: string;
}

export interface Medicine {
  id: string;
  /** e.g. "Tab. Paracetamol 500 mg" */
  name: string;
  /** Daily pattern such as 1+0+1 or free text. */
  dose: string;
  /** Before / after meal etc. */
  timing: string;
  duration: string;
  note: string;
}

export interface Prescription {
  id: string;
  date: string; // yyyy-mm-dd
  patient: Patient;
  complaints: string;
  history: string;
  examination: string;
  investigations: string;
  diagnosis: string;
  medicines: Medicine[];
  advice: string;
  followUp: string;
  updatedAt: number;
}

/** A reusable "order set": everything except the patient. */
export interface RxTemplate {
  id: string;
  name: string;
  data: Pick<Prescription, 'complaints' | 'examination' | 'investigations' | 'diagnosis' | 'medicines' | 'advice'>;
}

export function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function emptyMedicine(partial: Partial<Medicine> = {}): Medicine {
  return { id: newId('med'), name: '', dose: '', timing: '', duration: '', note: '', ...partial };
}

export function emptyRx(): Prescription {
  return {
    id: newId('rx'),
    date: today(),
    patient: { name: '', age: '', sex: '', weight: '', phone: '', id: '' },
    complaints: '',
    history: '',
    examination: '',
    investigations: '',
    diagnosis: '',
    medicines: [],
    advice: '',
    followUp: '',
    updatedAt: Date.now(),
  };
}

export const DOSE_CHIPS = ['1+0+0', '0+0+1', '1+0+1', '1+1+1', '0+1+0', '1+1+1+1', 'SOS'];
export const TIMING_CHIPS = ['Before meal', 'After meal', 'With meal', 'At bedtime', 'Empty stomach'];
export const DURATION_CHIPS = ['3 days', '5 days', '7 days', '14 days', '1 month', 'Continue'];
export const FORM_PREFIXES = ['Tab.', 'Cap.', 'Syr.', 'Susp.', 'Inj.', 'Drop', 'Oint.', 'Cream', 'Inh.', 'Sach.'];

/** Small starter list of generics; the doctor's own entries are learned on top. */
export const STARTER_DRUGS = [
  'Tab. Paracetamol 500 mg', 'Tab. Paracetamol 665 mg ER', 'Syr. Paracetamol 120 mg/5 ml',
  'Cap. Omeprazole 20 mg', 'Cap. Esomeprazole 20 mg', 'Tab. Pantoprazole 40 mg',
  'Tab. Cetirizine 10 mg', 'Tab. Fexofenadine 120 mg', 'Tab. Montelukast 10 mg',
  'Cap. Amoxicillin 500 mg', 'Tab. Azithromycin 500 mg', 'Tab. Cefixime 200 mg', 'Cap. Doxycycline 100 mg',
  'Tab. Metronidazole 400 mg', 'Tab. Ciprofloxacin 500 mg',
  'Tab. Metformin 500 mg', 'Tab. Gliclazide 80 mg', 'Tab. Amlodipine 5 mg', 'Tab. Losartan 50 mg',
  'Tab. Atorvastatin 10 mg', 'Tab. Bisoprolol 2.5 mg', 'Tab. Aspirin 75 mg', 'Tab. Clopidogrel 75 mg',
  'Tab. Domperidone 10 mg', 'Tab. Ondansetron 8 mg', 'ORS sachet', 'Tab. Zinc 20 mg',
  'Tab. Calcium + Vitamin D', 'Cap. Vitamin B complex', 'Tab. Folic acid 5 mg', 'Tab. Iron + Folic acid',
  'Tab. Naproxen 500 mg', 'Tab. Diclofenac 50 mg', 'Gel Diclofenac 1%',
  'Inh. Salbutamol 100 mcg', 'Syr. Salbutamol 2 mg/5 ml', 'Tab. Levothyroxine 50 mcg',
];

/** True when nothing meaningful has been typed yet. */
export function isBlank(rx: Prescription): boolean {
  const p = rx.patient;
  return !p.name && !p.age && !rx.complaints && !rx.diagnosis && !rx.advice &&
    rx.medicines.every((m) => !m.name.trim());
}
