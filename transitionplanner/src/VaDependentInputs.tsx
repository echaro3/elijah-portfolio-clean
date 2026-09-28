import SelectControl from "./SelectControl";
import { type VaDependents } from "./data/vaDependents";

export default function VaDependentInputs({ value, onChange }: { value: VaDependents; onChange: (value: VaDependents) => void }) {
  return <div className="va-dependent-inputs">
    <label className="checkbox-row"><input type="checkbox" checked={value.spouse} onChange={e => onChange({ ...value, spouse: e.target.checked, spouseAid: e.target.checked && value.spouseAid })} /><span>Dependent spouse</span></label>
    <SelectControl label="Dependent parents" value={value.parents} options={[0, 1, 2].map(n => ({ value: n, label: String(n) }))} onChange={parents => onChange({ ...value, parents })} />
    <div className="field-pair setup-fields">
      <label className="setup-field"><span>Children under 18</span><input type="number" min={0} max={99} step={1} value={value.children} onChange={e => onChange({ ...value, children: Math.max(0, Math.min(99, Math.floor(Number(e.target.value)))) })} /></label>
      <label className="setup-field"><span>Children 18-23 in qualifying school</span><input type="number" min={0} max={99} step={1} value={value.students} onChange={e => onChange({ ...value, students: Math.max(0, Math.min(99, Math.floor(Number(e.target.value)))) })} /></label>
    </div>
    {value.spouse && <label className="checkbox-row"><input type="checkbox" checked={value.spouseAid} onChange={e => onChange({ ...value, spouseAid: e.target.checked })} /><span>Spouse awarded Aid and Attendance</span></label>}
    <p className="field-note">Include only VA-eligible dependents. Do not count a child in both groups. Other dependent circumstances, including a child permanently incapable of self-support, need VA confirmation.</p>
  </div>;
}
