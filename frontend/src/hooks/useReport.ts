import { useState, useEffect } from "react";
import { reportsApi } from "../api/reports";
import type { Report } from "../api/reports";

const CYCLE_ID = "a0000000-0000-0000-0000-000000000001";

export function useReport(userId: string | undefined) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    reportsApi
      .list({ cycle_id: CYCLE_ID })
      .then((res) => {
        const mine = res.data.find((r) => r.user_id === userId);
        if (mine) {
          setReport(mine);
        } else {
          return reportsApi.create({
            cycle_id: CYCLE_ID,
            completed_content: "",
            working_on_content: "",
            blockers_content: "",
            plans_content: "",
          }).then(setReport);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const save = async (updates: Partial<Report>) => {
    if (!report) return;
    const updated = await reportsApi.update(report.id, updates);
    setReport(updated);
    return updated;
  };

  const submit = async () => {
    if (!report) return;
    const updated = await reportsApi.submit(report.id);
    setReport(updated);
    return updated;
  };

  return { report, loading, error, save, submit };
}
