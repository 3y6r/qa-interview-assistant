import { useState, useCallback, useRef } from 'react';
import { Button, Empty, Tag, Card, Rate } from 'antd';
import { CloseOutlined, MenuOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useEditorStore } from '../../../stores/editorStore';
import { LEVELS_QUERY_KEY } from '../../../utils/constants';
import { useQuery } from '@tanstack/react-query';
import { levelsApi } from '../../../api/levels';
import { categoriesApi } from '../../../api/categories';
import type { Question } from '../../../types';
import styles from './SelectedQuestionsPanel.module.css';

function QuestionCard({ q, index }: { q: Question; index: number }) {
  const { removeQuestion, reorderQuestions, selectedQuestions, scores, setScore } = useEditorStore();
  const qs = scores[q.id];
  const [showAnswer, setShowAnswer] = useState(false);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const { data: levels = [] } = useQuery({ queryKey: [LEVELS_QUERY_KEY], queryFn: levelsApi.list });

  const cat = categories.find((c: any) => c.id === q.categoryId);
  const levelName = q.levelId ? levels.find((l: any) => l.id === q.levelId)?.name : null;

  return (
    <div className={styles.questionCard}>
      <div className={styles.questionRow}>
        <MenuOutlined className={styles.dragHandle} />
        <div className={styles.questionContent} style={{ paddingLeft: 12 }}>
          <div className={styles.questionHeader}>
            <span className={styles.questionText}>
              {index + 1}. {q.text}
            </span>
            <span className={styles.questionActions}>
              <Button type="text" size="small" disabled={index === 0} onClick={() => reorderQuestions(index, index - 1)}>↑</Button>
              <Button type="text" size="small" disabled={index === selectedQuestions.length - 1} onClick={() => reorderQuestions(index, index + 1)}>↓</Button>
              <Button type="text" size="small" danger icon={<CloseOutlined />} onClick={() => removeQuestion(q.id)} />
            </span>
          </div>
          <div className={styles.tagsRow}>
            {cat && <Tag className={styles.tag}>{cat.name}</Tag>}
            {levelName && <Tag color="blue" className={styles.tag}>{levelName}</Tag>}
            {q.tags.map(t => <Tag key={t.id} color={t.color || '#108ee9'} className={styles.tag}>{t.name}</Tag>)}
          </div>
          <div className={styles.ratingRow}>
            <div className={styles.rating}>
              <Rate count={10} value={qs?.score ?? 0} onChange={(v) => setScore(q.id, v)} className={styles.stars} />
              <span className={styles.scoreLabel}>{qs?.score ?? '—'}/10</span>
            </div>
            <div className={styles.commentRow}>
              <Button type="link" size="small" icon={showAnswer ? <EyeInvisibleOutlined /> : <EyeOutlined />} onClick={() => setShowAnswer(!showAnswer)}>
                {showAnswer ? 'Скрыть' : 'Ответ'}
              </Button>
            </div>
          </div>
          {showAnswer && (
            <div className={styles.answerBox}>
              {q.expectedAnswer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function SelectedQuestionsPanel() {
  const { selectedQuestions, addQuestion } = useEditorStore();
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDragEnter = useCallback(() => {
    dragCounter.current += 1;
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOver(false);
    try {
      const json = e.dataTransfer.getData('application/json');
      if (json) {
        const q = JSON.parse(json);
        if (q && q.id) addQuestion(q);
      }
    } catch {}
  }, [addQuestion]);

  const isEmpty = selectedQuestions.length === 0;

  return (
    <Card
      size="small"
      title={`Выбранные вопросы (${selectedQuestions.length})`}
      className={`${styles.card} ${dragOver ? styles.cardDragOver : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      styles={{
        body: {
          flex: 1,
          overflow: 'auto',
          padding: 8,
          ...(isEmpty ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}),
        },
      }}
    >
      {isEmpty ? (
        <Empty description="Перетащите вопросы сюда или добавьте кнопкой" />
      ) : (
        selectedQuestions.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)
      )}
    </Card>
  );
}
