import { useEffect, useState } from 'react';
import axios from '../api/axios';

// Custom hook to fetch all departments and return a map of id->name
export default function useDepartments(shouldFetch = true) {
  const [departments, setDepartments] = useState([]);
  const [deptMap, setDeptMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!shouldFetch) return;
    setLoading(true);
    axios.get('/departments')
      .then(res => {
        setDepartments(res.data);
        const map = {};
        res.data.forEach(dep => {
          map[dep._id] = dep.name;
        });
        setDeptMap(map);
      })
      .catch(() => {
        setDepartments([]);
        setDeptMap({});
      })
      .finally(() => setLoading(false));
  }, [shouldFetch]);

  return { departments, deptMap, loading };
}
