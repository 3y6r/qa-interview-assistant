import { useState } from 'react';
import { Button, Modal, Statistic, Row, Col, Tag, Descriptions, Table, message } from 'antd';
import { CalculatorOutlined, RotateLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { CandidateCard } from '../features/workspace/candidate/CandidateCard';
import { SelectedQuestionsPanel } from '../features/workspace/panel/SelectedQuestionsPanel';
import { QuestionList } from '../features/workspace/questions/QuestionList';
import { useEditorStore } from '../stores/editorStore';
import { interviewsApi } from '../api/interviews';
import { QUESTION_LEVELS } from '../utils/constants';
import styles from './WorkspacePage.module.css';

export function WorkspacePage() {
  const { candidate, selectedQuestions, scores, reset } = useEditorStore();
  const canStart = !!candidate && selectedQuestions.length > 0;
  const [resultOpen, setResultOpen] = useState(false);

  const calculateResult = () => {
    const allScores = Object.values(scores);
    const rated = allScores.filter((s) => s.score > 0);
    const totalScore = rated.reduce((sum, s) => sum + s.score, 0);
    const averageScore = rated.length ? totalScore / selectedQuestions.length : 0;
    let finalGrade = 'N/A';
    if (averageScore >= 8) finalGrade = 'Отлично';
    else if (averageScore >= 6) finalGrade = 'Хорошо';
    else if (averageScore >= 4) finalGrade = 'Удовлетворительно';
    else if (averageScore > 0) finalGrade = 'Плохо';
    return { totalScore, averageScore, finalGrade, ratedCount: rated.length };
  };

  const handleCalculate = () => {
    if (!canStart) return;
    const unrated = selectedQuestions.filter((q) => !scores[q.id] || scores[q.id].score === 0);
    if (unrated.length > 0) {
      message.warning(`${unrated.length} вопрос${unrated.length === 1 ? '' : 'ов'} ещё не оценен${unrated.length === 1 ? '' : 'ы'}`);
    }
    setResultOpen(true);
  };

  const handleReset = () => {
    reset();
    setResultOpen(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const interview = await interviewsApi.create({
        candidateName: candidate!.candidateName,
        position: candidate!.position,
        level: candidate!.level,
        topicIds: candidate!.topicIds,
        questionIds: selectedQuestions.map((q) => q.id),
      });
      for (const q of selectedQuestions) {
        const qs = scores[q.id];
        if (qs && qs.score > 0) {
          await interviewsApi.rateQuestion(interview.id, q.id, { score: qs.score, comment: qs.comment || undefined });
        }
      }
      await interviewsApi.complete(interview.id);
      return interview;
    },
    onSuccess: () => {
      message.success('Отчёт сохранён');
      setResultOpen(false);
      reset();
    },
    onError: () => message.error('Ошибка при сохранении'),
  });

  const handleSave = () => {
    if (!candidate) return;
    saveMutation.mutate();
  };

  const result = calculateResult();

  const columns = [
    { title: '№', key: 'index', width: 40, render: (_: any, __: any, i: number) => i + 1 },
    { title: 'Вопрос', dataIndex: 'text', key: 'question' },
    { title: 'Оценка', key: 'score', render: (_: any, q: any) => scores[q.id]?.score ?? '—' },
    { title: 'Комментарий', key: 'comment', render: (_: any, q: any) => scores[q.id]?.comment || '—' },
  ];

  return (
    <>
      <div className={styles.workspace}>
        <div className={styles.leftColumn}>
          <CandidateCard />
          <SelectedQuestionsPanel />
          <div className={styles.actions}>
            <Button
              type="primary"
              size="large"
              icon={<CalculatorOutlined />}
              disabled={!canStart}
              onClick={handleCalculate}
              className={styles.actionButton}
            >
              Подсчитать баллы
            </Button>
            <Button size="large" icon={<RotateLeftOutlined />} onClick={handleReset}>Сброс</Button>
          </div>
        </div>
        <div className={styles.rightColumn}>
          <QuestionList />
        </div>
      </div>

      <Modal
        title="Результат собеседования"
        open={resultOpen}
        onCancel={() => setResultOpen(false)}
        footer={[
          <Button key="save" type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saveMutation.isPending}>
            Сохранить отчёт
          </Button>,
          <Button key="close" onClick={() => setResultOpen(false)}>Закрыть</Button>,
        ]}
        width={700}
      >
        {candidate && (
          <>
            <Row gutter={16} className={styles.resultStats}>
              <Col span={8}>
                <Statistic title="Сумма баллов" value={result.totalScore} suffix={`/ ${selectedQuestions.length * 10}`} />
              </Col>
              <Col span={8}>
                <Statistic title="Средний балл" value={result.averageScore.toFixed(1)} suffix="/ 10" />
              </Col>
              <Col span={8}>
                <Statistic title="Итоговая оценка" valueRender={() => (
                  <Tag color={result.finalGrade === 'Отлично' ? 'green' : result.finalGrade === 'Хорошо' ? 'blue' : result.finalGrade === 'Удовлетворительно' ? 'orange' : 'red'} className={styles.gradeTag}>
                    {result.finalGrade}
                  </Tag>
                )} />
              </Col>
            </Row>
            <Descriptions size="small" column={2} className={styles.resultDescription}>
              <Descriptions.Item label="Кандидат">{candidate.candidateName}</Descriptions.Item>
              <Descriptions.Item label="Должность">{candidate.position}</Descriptions.Item>
              <Descriptions.Item label="Уровень">{QUESTION_LEVELS.find(l => l.value === candidate.level)?.label}</Descriptions.Item>
              <Descriptions.Item label="Оценено вопросов">{result.ratedCount} / {selectedQuestions.length}</Descriptions.Item>
            </Descriptions>
            <Table dataSource={selectedQuestions} columns={columns} rowKey="id" pagination={false} size="small" />
          </>
        )}
      </Modal>
    </>
  );
}
