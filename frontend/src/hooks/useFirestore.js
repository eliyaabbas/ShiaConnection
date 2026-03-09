import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../services/firebase';

export function useFirestoreCollection(collectionName, queryOptions = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    let q = query(collection(db, collectionName));
    
    // Apply optional query filters
    if (queryOptions.orderByField) {
      q = query(q, orderBy(queryOptions.orderByField, queryOptions.orderDirection || 'asc'));
    }
    if (queryOptions.whereFilter) {
      q = query(q, where(...queryOptions.whereFilter));
    }
    if (queryOptions.limitCount) {
      q = query(q, limit(queryOptions.limitCount));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(documents);
      setLoading(false);
      setError(null);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(queryOptions)]); // Re-run if query options change deeply

  return { data, loading, error };
}
