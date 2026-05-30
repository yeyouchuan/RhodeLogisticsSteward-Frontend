import type { ScheduleDocument } from "../../domain/types";
import styles from "../../styles/canvas.module.css";

interface QueueTabsProps {
  document: ScheduleDocument;
  onActiveQueueChange: (queueId: string) => void;
}

export function QueueTabs({ document, onActiveQueueChange }: QueueTabsProps) {
  return (
    <nav aria-label="队列" className={styles.queueTabs}>
      {document.queues.map((queue, index) => (
        <button
          aria-pressed={queue.id === document.activeQueueId}
          className={styles.queueTab}
          data-active={queue.id === document.activeQueueId}
          key={queue.id}
          onClick={() => onActiveQueueChange(queue.id)}
          type="button"
        >
          <span>{queue.label || `队列 ${index + 1}`}</span>
        </button>
      ))}
    </nav>
  );
}
