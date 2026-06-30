import { Input, Select, DatePicker, Space, Button } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { QUESTION_LEVELS } from '../../utils/constants';
import styles from './HistoryFilters.module.css';

const { RangePicker } = DatePicker;

type Filters = {
  candidateName: string;
  level: string;
  status: string;
  fromDate: string;
  toDate: string;
};

interface HistoryFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const STATUS_OPTIONS = [
  { value: 'PLANNED', label: 'Запланировано' },
  { value: 'IN_PROGRESS', label: 'В процессе' },
  { value: 'COMPLETED', label: 'Завершено' },
];

export function HistoryFilters({ filters, onChange }: HistoryFiltersProps) {
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const handleClear = () => onChange({
    candidateName: '', level: '', status: '', fromDate: '', toDate: '',
  });

  return (
    <Space wrap className={styles.filters}>
      <Input
        placeholder="Поиск по имени"
        prefix={<SearchOutlined />}
        value={filters.candidateName}
        onChange={(e) => update({ candidateName: e.target.value })}
        className={styles.nameInput}
        allowClear
      />
      <Select
        placeholder="Уровень"
        value={filters.level || undefined}
        onChange={(v) => update({ level: v ?? '' })}
        options={QUESTION_LEVELS.map((l) => ({ value: l.value, label: l.label }))}
        className={styles.levelSelect}
        allowClear
      />
      <Select
        placeholder="Статус"
        value={filters.status || undefined}
        onChange={(v) => update({ status: v ?? '' })}
        options={STATUS_OPTIONS}
        className={styles.statusSelect}
        allowClear
      />
      <RangePicker
        onChange={(_, dateStrings) => update({ fromDate: dateStrings[0], toDate: dateStrings[1] })}
        format="YYYY-MM-DD"
      />
      <Button icon={<ClearOutlined />} onClick={handleClear}>Сбросить</Button>
    </Space>
  );
}
