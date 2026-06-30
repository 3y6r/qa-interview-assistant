import { useState } from 'react';
import { Card, Table, Tag, Typography, Modal, Descriptions, Button, Statistic, Row, Col } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import { interviewsApi } from '../api/interviews';
import type { Interview } from '../types';
import { HistoryFilters } from '../features/history/HistoryFilters';
import { QUESTION_LEVELS } from '../utils/constants';
import styles from './HistoryPage.module.css';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PLANNED: { label: 'Запланировано', color: 'default' },
  IN_PROGRESS: { label: 'В процессе', color: 'processing' },
  COMPLETED: { label: 'Завершено', color: 'success' },
};

type Filters = {
  candidateName: string;
  level: string;
  status: string;
  fromDate: string;
  toDate: string;
};

export function HistoryPage() {
  const [filters, setFilters] = useState<Filters>({
    candidateName: '', level: '', status: '', fromDate: '', toDate: '',
  });
  const [page, setPage] = useState(1);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['interviews', filters, page],
    queryFn: () => interviewsApi.list({
      ...filters,
      page,
      size: 10,
      sort: 'createdAt,desc',
    }),
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['interview-detail', selectedInterview?.id],
    queryFn: async () => {
      const [result, questions] = await Promise.all([
        interviewsApi.getResult(selectedInterview!.id),
        selectedInterview!.status === 'COMPLETED' ? interviewsApi.getQuestions(selectedInterview!.id) : Promise.resolve([]),
      ]);
      return { result, questions };
    },
    enabled: !!selectedInterview,
    staleTime: 0,
  });

  const columns: ColumnsType<Interview> = [
    {
      title: 'Кандидат', dataIndex: 'candidateName', key: 'candidateName', width: 180,
    },
    {
      title: 'Должность', dataIndex: 'position', key: 'position', width: 180,
    },
    {
      title: 'Уровень', dataIndex: 'level', key: 'level', width: 100,
      render: (level) => {
        const l = QUESTION_LEVELS.find((l) => l.value === level);
        return l ? <Tag>{l.label}</Tag> : level;
      },
    },
    {
      title: 'Статус', dataIndex: 'status', key: 'status', width: 140,
      render: (status) => {
        const s = STATUS_MAP[status];
        return s ? <Tag color={s.color}>{s.label}</Tag> : status;
      },
    },
    {
      title: 'Дата создания', dataIndex: 'createdAt', key: 'createdAt', width: 170,
      render: (val) => new Date(val).toLocaleString('ru-RU'),
    },
    {
      title: '', key: 'actions', width: 60,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setSelectedInterview(record)}
        />
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4} className={styles.title}>История интервью</Typography.Title>

      <Card size="small" className={styles.filterCard}>
        <HistoryFilters filters={filters} onChange={(f) => { setFilters(f); setPage(1); }} />
      </Card>

      <Table<Interview>
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: 10,
          total: data?.total ?? 0,
          onChange: setPage,
          showTotal: (total) => `Всего: ${total}`,
          showSizeChanger: false,
        }}
        locale={{ emptyText: 'Нет сохранённых интервью' }}
        size="middle"
      />

      <Modal
        title={`Интервью: ${selectedInterview?.candidateName ?? ''}`}
        open={!!selectedInterview}
        onCancel={() => setSelectedInterview(null)}
        footer={[
          <Button key="close" onClick={() => setSelectedInterview(null)}>Закрыть</Button>,
        ]}
        width={720}
        destroyOnClose
      >
        {selectedInterview && detailData && (
          <>
            <Descriptions size="small" column={2} className={styles.detailDescriptions}>
              <Descriptions.Item label="Кандидат">{selectedInterview.candidateName}</Descriptions.Item>
              <Descriptions.Item label="Должность">{selectedInterview.position}</Descriptions.Item>
              <Descriptions.Item label="Уровень">{QUESTION_LEVELS.find(l => l.value === selectedInterview.level)?.label}</Descriptions.Item>
              <Descriptions.Item label="Статус">
                <Tag color={STATUS_MAP[selectedInterview.status]?.color}>{STATUS_MAP[selectedInterview.status]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Дата">{new Date(selectedInterview.createdAt).toLocaleString('ru-RU')}</Descriptions.Item>
              {selectedInterview.completedAt && (
                <Descriptions.Item label="Завершено">{new Date(selectedInterview.completedAt).toLocaleString('ru-RU')}</Descriptions.Item>
              )}
              <Descriptions.Item label="Темы" span={2}>
                {selectedInterview.topics.map((t) => (
                  <Tag key={t.id}>{t.name}</Tag>
                ))}
              </Descriptions.Item>
            </Descriptions>

            {selectedInterview.status === 'COMPLETED' && (
              <>
                <Row gutter={16} className={styles.detailStats}>
                  <Col span={8}>
                    <Statistic title="Сумма баллов" value={detailData.result.totalScore} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Средний балл" value={detailData.result.averageScore.toFixed(1)} suffix="/ 10" />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Оценка" valueRender={() => (
                      <Tag color={
                        detailData.result.finalGrade === 'Отлично' ? 'green'
                        : detailData.result.finalGrade === 'Хорошо' ? 'blue'
                        : detailData.result.finalGrade === 'Удовлетворительно' ? 'orange'
                        : 'red'
                      } className={styles.detailGradeTag}>
                        {detailData.result.finalGrade}
                      </Tag>
                    )} />
                  </Col>
                </Row>

                <Typography.Text strong className={styles.questionsHeader}>Вопросы</Typography.Text>
                <Table
                  dataSource={detailData.questions}
                  columns={[
                    { title: '№', key: 'index', width: 40, render: (_: any, __: any, i: number) => i + 1 },
                    { title: 'Вопрос', dataIndex: ['question', 'text'], key: 'text' },
                    { title: 'Оценка', dataIndex: 'score', key: 'score', width: 80, render: (s: number | null) => s ?? '—' },
                    { title: 'Комментарий', dataIndex: 'comment', key: 'comment', render: (c: string | null) => c || '—' },
                  ]}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  loading={detailLoading}
                  locale={{ emptyText: 'Нет данных' }}
                />
              </>
            )}

            {selectedInterview.status !== 'COMPLETED' && (
              <Typography.Text type="secondary">Интервью ещё не завершено. Результаты появятся после завершения.</Typography.Text>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
