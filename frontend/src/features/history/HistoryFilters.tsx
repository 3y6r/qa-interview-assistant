import { Input, DatePicker, Space, Button } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import styles from './HistoryFilters.module.css';

const { RangePicker } = DatePicker;

type Filters = {
  candidateName: string;
  fromDate: string;
  toDate: string;
};

interface HistoryFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

export function HistoryFilters({ filters, onChange }: HistoryFiltersProps) {
  const update = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });

  const handleClear = () => onChange({
    candidateName: '', fromDate: '', toDate: '',
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
      <RangePicker
        onChange={(_, dateStrings) => update({ fromDate: dateStrings[0], toDate: dateStrings[1] })}
        format="YYYY-MM-DD"
      />
      <Button icon={<ClearOutlined />} onClick={handleClear}>Сбросить</Button>
    </Space>
  );
}
