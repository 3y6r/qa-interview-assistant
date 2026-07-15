import { useState } from 'react';
import { Card, Table, Tag, Typography, Modal, Descriptions, Button, Statistic, Popconfirm, Tooltip, message } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import { interviewsApi } from '../api/interviews';
import type { InterviewResult } from '../types';
import { HistoryFilters } from '../features/history/HistoryFilters';
import styles from './HistoryPage.module.css';

const GRADE_MAP: Record<string, { label: string; color: string }> = {
  Отлично: { label: 'Отлично', color: 'green' },
  Хорошо: { label: 'Хорошо', color: 'blue' },
  Удовлетворительно: { label: 'Удовлетворительно', color: 'orange' },
  Плохо: { label: 'Плохо', color: 'red' },
};

function getGrade(averageScore: number): string {
  if (averageScore >= 8) return 'Отлично';
  if (averageScore >= 6) return 'Хорошо';
  if (averageScore >= 4) return 'Удовлетворительно';
  if (averageScore > 0) return 'Плохо';
  return 'N/A';
}

type Filters = {
  candidateName: string;
  fromDate: string;
  toDate: string;
};

export function HistoryPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>({
    candidateName: '', fromDate: '', toDate: '',
  });
  const [selectedResult, setSelectedResult] = useState<InterviewResult | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['interview-results', filters],
    queryFn: () => interviewsApi.list({
      candidateFullName: filters.candidateName || undefined,
      dateFrom: filters.fromDate || undefined,
      dateTo: filters.toDate || undefined,
      limit: 100,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => interviewsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-results'] });
      message.success('Результат удалён');
    },
    onError: () => message.error('Ошибка при удалении'),
  });

  const results = data || [];

  const columns: ColumnsType<InterviewResult> = [
    {
      title: 'Кандидат', dataIndex: 'candidateFullName', key: 'candidateFullName', width: 180,
      className: styles.centeredHeader,
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
    },
    {
      title: 'Должность', dataIndex: 'position', key: 'position', width: 180,
      className: styles.centeredHeader,
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
    },
    {
      title: 'Средний балл', dataIndex: 'averageScore', key: 'averageScore', width: 120,
      className: styles.centeredHeader,
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (score) => score.toFixed(1),
    },
    {
      title: 'Оценка', key: 'grade', width: 140,
      className: styles.centeredHeader,
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (_, record) => {
        const grade = getGrade(record.averageScore);
        const g = GRADE_MAP[grade];
        return g ? <Tag color={g.color}>{g.label}</Tag> : grade;
      },
    },
    {
      title: 'Дата интервью', dataIndex: 'interviewDate', key: 'interviewDate', width: 130,
      className: styles.centeredHeader,
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (val) => val,
    },
    {
      title: 'Действие', key: 'actions', width: 100,
      className: styles.centeredHeader,
      onHeaderCell: () => ({ style: { textAlign: 'center' } }),
      render: (_, record) => (
        <span style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <Tooltip title="Просмотреть">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setSelectedResult(record)}
            />
          </Tooltip>
          <Popconfirm title="Удалить результат?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Tooltip title="Удалить">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </span>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4} className={styles.title}>История интервью</Typography.Title>

      <Card size="small" className={styles.filterCard}>
        <HistoryFilters filters={filters} onChange={(f) => { setFilters(f); }} />
      </Card>

      <Table<InterviewResult>
        rowKey="id"
        columns={columns}
        dataSource={results}
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showTotal: (total) => `Всего: ${total}`,
          showSizeChanger: false,
        }}
        locale={{ emptyText: 'Нет сохранённых результатов' }}
        size="middle"
      />

      <Modal
        title={`Кандидат: ${selectedResult?.candidateFullName ?? ''}`}
        open={!!selectedResult}
        onCancel={() => setSelectedResult(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedResult(null)}>Закрыть</Button>,
        ]}
        width={550}
        destroyOnClose
      >
        {selectedResult && (
          <>
            <Descriptions size="small" column={2} className={styles.detailDescriptions}>
              <Descriptions.Item label="Должность">{selectedResult.position}</Descriptions.Item>
              <Descriptions.Item label="Оценка">
                {(() => {
                  const grade = getGrade(selectedResult.averageScore);
                  const g = GRADE_MAP[grade];
                  return <Tag color={g?.color || 'default'} className={styles.detailGradeTag}>{grade}</Tag>;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="Дата интервью">{selectedResult.interviewDate}</Descriptions.Item>
            </Descriptions>

            {selectedResult.comment && (
              <>
                <Statistic title="Средний балл" value={selectedResult.averageScore.toFixed(1)} suffix="/ 10" className={styles.detailStats} />
                <Typography.Text strong className={styles.questionsHeader}>Комментарий</Typography.Text>
                <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>{selectedResult.comment}</Typography.Paragraph>
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
