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
    console.log("SNAPSHOT size:", snap.size);
    console.log("CHANGES:", snap.docChanges().map(c => ({
      type: c.type,
      id: c.doc.id,
      trayOrder: (c.doc.data() as any)?.trayOrder
    })));

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
        attendant: (data.attendant ?? "").trim().toUpperCase(),
        trayOrder: typeof data.trayOrder === "number" ? data.trayOrder : 9999,
        tripId: data.tripId ?? null,
        tripAt: data.tripAt ?? null,
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
  tripId: null,
  tripAt: null,
  trayOrder: typeof (item as any).trayOrder === "number" ? (item as any).trayOrder : Date.now(),
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

    // Marca um grupo de itens da bandeja como "em viagem"
  markItemsInTrip: async (ids: string[], tripId: string) => {
    const batch = db.batch();

    ids.forEach((id) => {
      batch.update(db.collection(COLLECTION).doc(id), {
        tripId,
        tripAt: (firebase as any).firestore.FieldValue.serverTimestamp(),
        updatedAt: (firebase as any).firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
  },
  


// ✅ remove o vínculo da bandeja com uma viagem (quando FINALIZA ou EXCLUI)
clearTripByTripId: async (tripId: string) => {
  // busca todos os itens da bandeja que estão marcados com essa viagem
  const snap = await db
    .collection(COLLECTION)
    .where("tripId", "==", tripId)
    .get();

  if (snap.empty) return 0;

  // Firestore batch tem limite (500 ops). Usamos 450 por segurança.
  const docs = snap.docs;
  const CHUNK = 450;
  let cleared = 0;

  for (let i = 0; i < docs.length; i += CHUNK) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + CHUNK);

    chunk.forEach((doc) => {
      batch.update(doc.ref, {
        tripId: null,
        tripAt: null,
        updatedAt: (firebase as any).firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    cleared += chunk.length;
  }

  return cleared; // útil para log/alert
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

