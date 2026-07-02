import { useState } from 'react';
import { Card, Table, Typography, Modal, Descriptions, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { interviewsApi } from '../api/interviews';
import type { InterviewResult } from '../types';
import { HistoryFilters, type HistoryFiltersValue } from '../features/history/HistoryFilters';
import styles from './HistoryPage.module.css';

export function HistoryPage() {
  const [filters, setFilters] = useState<HistoryFiltersValue>({
    candidateName: '', fromDate: '', toDate: '',
  });
  const [selectedResult, setSelectedResult] = useState<InterviewResult | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['interview-results', filters],
    queryFn: () => interviewsApi.list(filters),
  });

  const columns: ColumnsType<InterviewResult> = [
    {
      title: 'Кандидат', dataIndex: 'candidate_full_name', key: 'candidate_full_name', width: 220,
    },
    {
      title: 'Дата собеседования', dataIndex: 'interview_date', key: 'interview_date', width: 170,
      render: (value) => dayjs(value).format('DD.MM.YYYY'),
    },
    {
      title: 'Средний балл', dataIndex: 'average_score', key: 'average_score', width: 140,
      render: (value) => Number(value).toFixed(1),
    },
    {
      title: 'Комментарий', dataIndex: 'comment', key: 'comment', ellipsis: true,
    },
    {
      title: 'Сохранено', dataIndex: 'created_at', key: 'created_at', width: 170,
      render: (value) => dayjs(value).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: '', key: 'actions', width: 60,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setSelectedResult(record)}
        />
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4} className={styles.title}>История интервью</Typography.Title>

      <Card size="small" className={styles.filterCard}>
        <HistoryFilters filters={filters} onChange={setFilters} />
      </Card>

      <Table<InterviewResult>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={isLoading}
        pagination={{ pageSize: 10, showTotal: (total) => `Всего: ${total}`, showSizeChanger: false }}
        locale={{ emptyText: 'Нет сохранённых интервью' }}
        size="middle"
      />

      <Modal
        title={`Интервью: ${selectedResult?.candidate_full_name ?? ''}`}
        open={!!selectedResult}
        onCancel={() => setSelectedResult(null)}
        footer={[<Button key="close" onClick={() => setSelectedResult(null)}>Закрыть</Button>]}
        width={620}
        destroyOnClose
      >
        {selectedResult && (
          <Descriptions size="small" column={1} className={styles.detailDescriptions}>
            <Descriptions.Item label="Кандидат">{selectedResult.candidate_full_name}</Descriptions.Item>
            <Descriptions.Item label="Дата собеседования">{dayjs(selectedResult.interview_date).format('DD.MM.YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Средний балл">{Number(selectedResult.average_score).toFixed(1)} / 10</Descriptions.Item>
            <Descriptions.Item label="Комментарий">{selectedResult.comment}</Descriptions.Item>
            <Descriptions.Item label="Сохранено">{dayjs(selectedResult.created_at).format('DD.MM.YYYY HH:mm')}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
}
