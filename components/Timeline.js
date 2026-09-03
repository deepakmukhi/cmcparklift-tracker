import { STAGE_GROUPS } from "../lib/stages";

export default function Timeline({ stages, editable, onStageClick }) {
  return (
    <div className="timeline">
      {STAGE_GROUPS.map((group, gi) => (
        <div className="stage-group" key={group.title}>
          <div className="group-head">
            <span className="group-num">0{gi + 1}</span>
            <span className="group-title">{group.title}</span>
            <span className="group-rule"></span>
          </div>
          {group.stages.map((s) => {
            const st = stages?.[s.key] || { status: "pending", date: "" };
            return (
              <div
                key={s.key}
                className={`stage-row ${editable ? "editable" : ""}`}
                onClick={editable ? () => onStageClick(s.key) : undefined}
              >
                <div className={`stamp stamp--${st.status}`}></div>
                <div className="stage-info">
                  <span className="stage-label">{s.label}</span>
                  {st.date ? <span className="stage-date">{st.date}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
