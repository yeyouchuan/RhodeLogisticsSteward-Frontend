import type { ScheduleDocument } from "../../domain/types";
import styles from "../../styles/canvas.module.css";
import { EditableText } from "./EditableText";

interface CanvasHeaderProps {
  document: ScheduleDocument;
  onMetadataChange: (patch: {
    title?: string;
    subtitle?: string;
    productionSummary?: Partial<ScheduleDocument["productionSummary"]>;
    droneSummary?: Partial<ScheduleDocument["droneSummary"]>;
  }) => void;
}

function markManual() {
  return "手动编辑数值";
}

function productionLine(summary: ScheduleDocument["productionSummary"]) {
  return [summary.orderText, summary.goldText, summary.recordText].filter(Boolean).join(" · ");
}

export function CanvasHeader({ document, onMetadataChange }: CanvasHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.titleBlock}>
        <EditableText
          ariaLabel="编辑标题"
          as="h1"
          className={styles.title}
          onCommit={(title) => onMetadataChange({ title })}
          value={document.title}
        />
        <EditableText
          ariaLabel="编辑副标题"
          as="p"
          className={styles.subtitle}
          onCommit={(subtitle) => onMetadataChange({ subtitle })}
          value={document.subtitle}
        />
      </div>
      <div className={styles.summary} aria-label="生产摘要">
        <div className={styles.productionLine}>
          <span className={styles.summaryLabel}>产出计算</span>
          <EditableText
            ariaLabel="产出计算"
            className={styles.summaryValue}
            onCommit={(orderText) =>
              onMetadataChange({
                productionSummary: {
                  orderText,
                  goldText: "",
                  recordText: "",
                  customLine: markManual(),
                },
              })
            }
            value={productionLine(document.productionSummary)}
          />
        </div>
        {document.productionSummary.customLine ? (
          <div className={styles.summaryNote}>
            <span className={styles.summaryLabel}>NOTE</span>
            <EditableText
              ariaLabel="编辑生产备注"
              className={styles.summaryValue}
              onCommit={(customLine) => onMetadataChange({ productionSummary: { customLine } })}
              value={document.productionSummary.customLine}
            />
          </div>
        ) : null}
      </div>
      <div className={styles.droneBox}>
        <span className={styles.droneTitle}>
          DRONE /{" "}
          <EditableText
            ariaLabel="编辑无人机目标"
            onCommit={(targetRoomLabel) => onMetadataChange({ droneSummary: { targetRoomLabel } })}
            value={document.droneSummary.targetRoomLabel}
          />
        </span>
        <EditableText
          ariaLabel="编辑无人机摘要"
          className={styles.droneText}
          multiline
          onCommit={(summaryText) => onMetadataChange({ droneSummary: { summaryText } })}
          value={document.droneSummary.summaryText}
        />
      </div>
    </header>
  );
}
