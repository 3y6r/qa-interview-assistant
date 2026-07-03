import { useState } from 'react';
import { Card, Table, Tag, Typography, Modal, Descriptions, Button, Statistic, Row, Col } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
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

  const results = data || [];

  const columns: ColumnsType<InterviewResult> = [
    {
      title: 'Кандидат', dataIndex: 'candidateFullName', key: 'candidateFullName', width: 180,
    },
    {
      title: 'Должность', dataIndex: 'position', key: 'position', width: 180,
    },
    {
      title: 'Средний балл', dataIndex: 'averageScore', key: 'averageScore', width: 120,
      render: (score) => score.toFixed(1),
    },
    {
      title: 'Оценка', key: 'grade', width: 140,
      render: (_, record) => {
        const grade = getGrade(record.averageScore);
        const g = GRADE_MAP[grade];
        return g ? <Tag color={g.color}>{g.label}</Tag> : grade;
      },
    },
    {
      title: 'Дата интервью', dataIndex: 'interviewDate', key: 'interviewDate', width: 130,
      render: (val) => val,
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
        title={`Результат: ${selectedResult?.candidateFullName ?? ''}`}
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
              <Descriptions.Item label="Кандидат">{selectedResult.candidateFullName}</Descriptions.Item>
              <Descriptions.Item label="Должность">{selectedResult.position}</Descriptions.Item>
              <Descriptions.Item label="Дата интервью">{selectedResult.interviewDate}</Descriptions.Item>
            </Descriptions>

            <Row gutter={16} className={styles.detailStats}>
              <Col span={12}>
                <Statistic title="Средний балл" value={selectedResult.averageScore.toFixed(1)} suffix="/ 10" />
              </Col>
              <Col span={12}>
                <Statistic title="Оценка" valueRender={() => {
                  const grade = getGrade(selectedResult.averageScore);
                  const g = GRADE_MAP[grade];
                  return (
                    <Tag color={g?.color || 'default'} className={styles.detailGradeTag}>
                      {grade}
                    </Tag>
                  );
                }} />
              </Col>
            </Row>

            {selectedResult.comment && (
              <>
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
