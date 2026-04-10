import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  AnalysisReport,
  CityRate,
  FloorPlanAnalysisResult,
  LabourRate,
  MarketPriceResponse,
  MaterialRate,
  ProjectRecord,
  SiteObservationInput,
  SiteObservationResult,
  TaskItem,
  UserProfile,
  VendorQuote,
  VerifiedPriceEntry,
} from '../types';
import { auth, db } from './firebase';

export async function saveProject(record: ProjectRecord) {
  const ownerId = auth.currentUser?.uid;
  if (!ownerId) throw new Error('Not authenticated');

  const ref = await addDoc(collection(db, 'projects'), {
    ownerId,
    status: 'active',
    memberIds: [ownerId],
    input: record.input,
    estimate: record.estimate,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await Promise.all(
    record.estimate.tasks.map((task) => setDoc(doc(db, 'projects', ref.id, 'tasks', task.id), { ...task, updatedAt: serverTimestamp() })),
  );

  return ref.id;
}

export async function getProject(projectId: string): Promise<ProjectRecord | null> {
  const snap = await getDoc(doc(db, 'projects', projectId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<ProjectRecord, 'id'>) };
}

export async function saveAnalysisReport(projectId: string, report: AnalysisReport) {
  await addDoc(collection(db, 'projects', projectId, 'reports'), {
    ...report,
    projectId,
    createdAt: serverTimestamp(),
  });
}

export async function updateTaskStatus(projectId: string, taskId: string, status: TaskItem['status']) {
  return updateDoc(doc(db, 'projects', projectId, 'tasks', taskId), { status, updatedAt: serverTimestamp() });
}

export async function listProjects() {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];
  const snapshot = await getDocs(query(collection(db, 'projects'), where('memberIds', 'array-contains', uid), orderBy('createdAt', 'desc'), limit(20)));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<ProjectRecord, 'id'>) }));
}

export async function listAnalysisReports() {
  const projects = await listProjects();
  const reports: AnalysisReport[] = [];
  for (const project of projects.slice(0, 10)) {
    if (!project.id) continue;
    const snapshot = await getDocs(query(collection(db, 'projects', project.id, 'reports'), orderBy('createdAt', 'desc'), limit(3)));
    snapshot.docs.forEach((entry) => reports.push({ id: entry.id, ...(entry.data() as Omit<AnalysisReport, 'id'>) }));
  }
  return reports;
}

async function listMasterCollection<T>(collectionName: string): Promise<T[]> {
  const snapshot = await getDocs(collection(db, 'masters', collectionName, 'rows'));
  if (snapshot.empty) return [];
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<T, 'id'>) } as T));
}

export async function listCityRates(): Promise<CityRate[]> {
  return listMasterCollection('cities');
}

export async function listMaterialRates(): Promise<MaterialRate[]> {
  return listMasterCollection('materials');
}

export async function listLabourRates(): Promise<LabourRate[]> {
  return listMasterCollection('labour');
}

export async function upsertMaster<T extends { id: string }>(collectionName: string, row: T) {
  return setDoc(doc(db, 'masters', collectionName, 'rows', row.id), { ...row, updatedAt: serverTimestamp() }, { merge: true });
}

export async function replaceMasterCollection<T extends { id: string }>(collectionName: string, rows: T[]) {
  await Promise.all(rows.map((row) => upsertMaster(collectionName, row)));
}

export async function saveMarketSnapshot(cityKey: string, payload: MarketPriceResponse) {
  return setDoc(doc(db, 'marketSnapshots', cityKey), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
}

export async function getMarketSnapshot(cityKey: string): Promise<MarketPriceResponse | null> {
  const snap = await getDoc(doc(db, 'marketSnapshots', cityKey));
  if (!snap.exists()) return null;
  return snap.data() as MarketPriceResponse;
}

export async function saveVendorQuote(projectId: string, quote: VendorQuote) {
  const ref = await addDoc(collection(db, 'projects', projectId, 'quotes'), {
    ...quote,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listVendorQuotes(projectId: string) {
  const snapshot = await getDocs(query(collection(db, 'projects', projectId, 'quotes'), orderBy('createdAt', 'desc'), limit(20)));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<VendorQuote, 'id'>) }));
}

export async function saveSiteObservation(projectId: string, input: SiteObservationInput, result?: SiteObservationResult) {
  const ref = await addDoc(collection(db, 'projects', projectId, 'siteObservations'), {
    input,
    result: result || null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listSiteObservations(projectId: string) {
  const snapshot = await getDocs(query(collection(db, 'projects', projectId, 'siteObservations'), orderBy('createdAt', 'desc'), limit(20)));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as { input: SiteObservationInput; result?: SiteObservationResult }) }));
}

export async function saveFloorPlanAnalysis(projectId: string, payload: { imageName?: string; result: FloorPlanAnalysisResult }) {
  const ref = await addDoc(collection(db, 'projects', projectId, 'floorPlanAnalyses'), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listVerifiedPriceEntries(cityId: string): Promise<VerifiedPriceEntry[]> {
  if (!cityId) return [];
  const snapshot = await getDocs(query(collection(db, 'verifiedPrices', cityId, 'rows'), orderBy('quoteDate', 'desc'), limit(200)));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<VerifiedPriceEntry, 'id'>) }));
}

export async function replaceVerifiedPriceEntries(cityId: string, rows: VerifiedPriceEntry[]) {
  await Promise.all(rows.map((row) => setDoc(doc(db, 'verifiedPrices', cityId, 'rows', row.id), { ...row, updatedAt: serverTimestamp() }, { merge: true })));
}

export function consolidateVerifiedRates(materials: MaterialRate[], verifiedEntries: VerifiedPriceEntry[]) {
  return materials.map((material) => {
    const hits = verifiedEntries.filter((entry) => entry.materialId === material.id).map((entry) => entry.rate).sort((a, b) => a - b);
    if (!hits.length) return material;
    const mid = hits[Math.floor(hits.length / 2)];
    return { ...material, baseRate: Math.round(mid) };
  });
}

export function watchProfile(uid: string, callback: (profile: UserProfile | null) => void) {
  return onSnapshot(doc(db, 'users', uid), (snapshot) => callback(snapshot.exists() ? (snapshot.data() as UserProfile) : null), () => callback(null));
}
