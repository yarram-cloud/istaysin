'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, FileText, Send } from 'lucide-react';
import { toast } from 'sonner';
import { tenantsApi } from '@/lib/api';

export function ComplianceSettings({ onBack }: { onBack: () => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [complianceEnabled, setComplianceEnabled] = useState(true);
  const [policeStationEmail, setPoliceStationEmail] = useState('');
  const [complianceStateFormat, setComplianceStateFormat] = useState('Standard');

  useEffect(() => {
    tenantsApi.getSettings()
      .then((res) => {
        if (res.success && res.data) {
          const config = res.data.config || {};
          setComplianceEnabled(config.complianceEnabled !== false);
          setPoliceStationEmail(config.policeStationEmail || '');
          setComplianceStateFormat(config.complianceStateFormat || 'Standard');
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await tenantsApi.getSettings();
      const currentConfig = res.data?.config || {};
      
      await tenantsApi.updateSettings({
        config: {
          ...currentConfig,
          complianceEnabled,
          policeStationEmail: complianceEnabled ? policeStationEmail : '',
          complianceStateFormat: complianceEnabled ? complianceStateFormat : 'Standard',
        }
      });
      toast.success(complianceEnabled ? 'Compliance Settings saved! 📝' : 'Compliance reporting disabled.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save compliance settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="glass-card p-12 text-center animate-pulse">
        <div className="h-8 bg-white/[0.06] rounded-lg w-48 mx-auto" />
      </div>
    );
  }

  return (
    <div>
      <div className="glass-card p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-display font-bold">Local Compliance</h2>
            <p className="text-sm text-surface-400">Configure FRRO and Police Register (Sarai Act) integrations</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-50 border border-surface-200">
            <div>
              <p className="font-medium text-surface-900">Enable Police Compliance Reporting</p>
              <p className="text-sm text-surface-500">Turn off if your property doesn&apos;t require Sarai Act compliance.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={complianceEnabled} onChange={(e) => setComplianceEnabled(e.target.checked)} />
              <div className="w-11 h-6 bg-surface-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          {complianceEnabled && (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold text-surface-900">Local Police Station (SHO) Details</h3>
                <p className="text-sm text-surface-400">Your daily guest register will be emailed to this address when submitted from the Compliance dashboard.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">Police Station Email Address</label>
                <div className="flex relative">
                  <input 
                    type="email" 
                    value={policeStationEmail} 
                    onChange={(e) => setPoliceStationEmail(e.target.value)} 
                    className="input-field pl-10" 
                    placeholder="sho.localstation@mahapolice.gov.in" 
                  />
                  <Send className="w-4 h-4 text-surface-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1">State Format Requirements</label>
                <select 
                  value={complianceStateFormat} 
                  onChange={(e) => setComplianceStateFormat(e.target.value)} 
                  className="input-field"
                >
                  <option value="Standard">Standard Format (Central)</option>
                  <option value="Maharashtra">Maharashtra Format</option>
                  <option value="Delhi">Delhi Format</option>
                  <option value="Goa">Goa Format</option>
                  <option value="Kerala">Kerala Format</option>
                </select>
                <p className="text-xs text-surface-500 mt-2">Adjusts the column layouts on the printed Master Register.</p>
              </div>
            </>
          )}

          {!complianceEnabled && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-sm text-amber-700">
                <strong>Note:</strong> Compliance reporting will be disabled. You can enable it later from Settings.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-surface-100">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Compliance Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
