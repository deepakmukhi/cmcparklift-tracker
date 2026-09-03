// Same production/shipping stages as the original tracker.
export const STAGE_GROUPS = [
  { title: "Engineering", stages: [
    { key: "th1", label: "Architectural drawing sent" },
    { key: "cm1", label: "Drawings confirmed" },
    { key: "th2", label: "Pit dimensions finalized" },
    { key: "cm2", label: "Final drawings approved" },
  ]},
  { title: "Manufacturing", stages: [
    { key: "cm21", label: "Steel cutting & welding" },
    { key: "cm22", label: "First quality check" },
    { key: "cm23", label: "Galvanization" },
    { key: "cm24", label: "Cleaning & second check" },
    { key: "cm25", label: "Painting" },
    { key: "cm26", label: "Full assembly" },
  ]},
  { title: "Testing & packing", stages: [
    { key: "cm27", label: "In-house testing" },
    { key: "cm28", label: "Test report issued" },
    { key: "cm29", label: "De-assembly & packing" },
  ]},
  { title: "Export", stages: [
    { key: "cm30", label: "Container loading" },
    { key: "th21", label: "Shipping company arranged" },
    { key: "th22", label: "Customs documents prepared" },
    { key: "th23", label: "Documents ready for shipping" },
  ]},
  { title: "Shipping", stages: [
    { key: "shipping", label: "In transit" },
  ]},
  { title: "Installation", stages: [
    { key: "th31", label: "Container received on site" },
    { key: "th32", label: "Transported to site" },
    { key: "th33", label: "Site setup" },
    { key: "th34", label: "Crane rental arranged" },
    { key: "th35", label: "Machine positioned" },
    { key: "th36", label: "First on-site test" },
  ]},
];

export const ALL_STAGES = STAGE_GROUPS.flatMap(g => g.stages);

export function freshStages() {
  const obj = {};
  ALL_STAGES.forEach(s => { obj[s.key] = { status: "pending", date: "" }; });
  return obj;
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function progressOf(machine) {
  const done = ALL_STAGES.filter(s => machine.stages?.[s.key]?.status === "done").length;
  return Math.round((done / ALL_STAGES.length) * 100);
}

export function currentStageInfo(machine) {
  for (const s of ALL_STAGES) {
    const st = machine.stages?.[s.key]?.status;
    if (st !== "done") return { label: s.label, status: st || "pending" };
  }
  return { label: "Installed and complete", status: "done" };
}
