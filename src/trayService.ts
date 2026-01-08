import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { db } from "../firebaseConfig";
import type { TrayItem } from "../types";

const COLLECTION = "bandeja";

export const trayService = {
  subscribe: (
    callback: (items: TrayItem[]) => void,
    error?: (err: firebase.firestore.FirestoreError) => void
  ) => {
    return db
      .collection(COLLECTION)
      .orderBy("trayOrder", "asc")
      .onSnapshot(
        (snap) => {
          const items: TrayItem[] = snap.docs.map((doc) => {
            const data = doc.data() as any;
            return {
              id: doc.id,
              region: data.region ?? "",
              city: data.city ?? "",
              date: data.date ?? "",
              clientName: data.clientName ?? "",
              status: data.status ?? "PENDENTE",
              equipment: data.equipment ?? "",
              observation: data.observation ?? "",
              attendant: data.attendant ?? "",
              trayOrder: typeof data.trayOrder === "number" ? data.trayOrder : 9999,
            };
          });
          callback(items);
        },
        error
      );
  },

  add: async (item: Omit<TrayItem, "id">) => {
    const ref = await db.collection(COLLECTION).add({
      ...item,
      createdAt: (firebase as any).firestore.FieldValue.serverTimestamp(),
      updatedAt: (firebase as any).firestore.FieldValue.serverTimestamp(),
    });
    return ref;
  },

  update: async (id: string, updates: Partial<TrayItem>) => {
    await db.collection(COLLECTION).doc(id).update({
      ...updates,
      updatedAt: (firebase as any).firestore.FieldValue.serverTimestamp(),
    });
  },

  remove: async (id: string) => {
    await db.collection(COLLECTION).doc(id).delete();
  },

  updateOrder: async (items: { id: string; trayOrder: number }[]) => {
    const batch = db.batch();
    items.forEach(({ id, trayOrder }) => {
      batch.update(db.collection(COLLECTION).doc(id), {
        trayOrder,
        updatedAt: (firebase as any).firestore.FieldValue.serverTimestamp(),
      });
    });
    await batch.commit();
  },
};

