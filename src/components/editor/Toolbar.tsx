import { Select } from "@base-ui/react/select";
import {
  ArrowCounterClockwiseIcon,
  CaretDownIcon,
  DownloadSimpleIcon,
  FileArrowDownIcon,
  FileArrowUpIcon,
} from "@phosphor-icons/react";
import { layoutPresets } from "../../data/layoutPresets";
import { queueCountOptions } from "../../domain/queueLimits";
import type { ScheduleDocument } from "../../domain/types";
import styles from "../../styles/editor.module.css";
import { ContourButton } from "../ui/ContourButton";

interface ToolbarProps {
  document: ScheduleDocument;
  onLayoutChange: (layoutId: string) => void;
  onQueueCountChange: (count: number) => void;
  onImportClick: () => void;
  onExportJson: () => void;
  onExportPng: () => void;
  onReset: () => void;
}

function SelectField({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <Select.Root items={items} onValueChange={(next) => onChange(String(next))} value={value}>
        <Select.Trigger className={styles.selectTrigger}>
          <Select.Value />
          <Select.Icon className={styles.selectIcon}>
            <CaretDownIcon size={14} />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            align="start"
            alignItemWithTrigger={false}
            className={styles.selectPositioner}
            collisionPadding={8}
            sideOffset={5}
          >
            <Select.Popup className={styles.selectPopup}>
              <Select.List className={styles.selectList}>
                {items.map((item) => (
                  <Select.Item className={styles.selectItem} key={item.value} value={item.value}>
                    <Select.ItemText>{item.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </label>
  );
}

export function Toolbar({
  document,
  onLayoutChange,
  onQueueCountChange,
  onImportClick,
  onExportJson,
  onExportPng,
  onReset,
}: ToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <SelectField
        items={layoutPresets.map((preset) => ({ label: preset.label, value: preset.id }))}
        label="布局"
        onChange={onLayoutChange}
        value={document.layoutId}
      />
      <SelectField
        items={queueCountOptions.map((count) => ({ label: `${count} 队列`, value: String(count) }))}
        label="队列"
        onChange={(value) => onQueueCountChange(Number(value))}
        value={String(document.queueCount)}
      />
      <ContourButton icon={<FileArrowUpIcon />} onClick={onImportClick} size="sm" variant="white">
        导入
      </ContourButton>
      <ContourButton icon={<FileArrowDownIcon />} onClick={onExportJson} size="sm" variant="white">
        JSON
      </ContourButton>
      <ContourButton icon={<ArrowCounterClockwiseIcon />} onClick={onReset} size="sm" variant="red">
        重置
      </ContourButton>
      <ContourButton icon={<DownloadSimpleIcon />} onClick={onExportPng} size="sm" variant="yellow">
        导出图片
      </ContourButton>
    </div>
  );
}
