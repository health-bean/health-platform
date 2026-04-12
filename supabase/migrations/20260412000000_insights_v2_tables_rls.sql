-- Insights v2: RLS policies for day_composites, insight_snapshots, insight_alerts

ALTER TABLE day_composites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own day composites" ON day_composites
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE insight_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own insight snapshots" ON insight_snapshots
  FOR ALL USING (user_id = auth.uid());

ALTER TABLE insight_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own insight alerts" ON insight_alerts
  FOR ALL USING (user_id = auth.uid());
