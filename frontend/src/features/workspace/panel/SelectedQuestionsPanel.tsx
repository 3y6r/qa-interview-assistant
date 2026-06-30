import { useState, useCallback } from 'react';
import { Button, Empty, Tag, Card, Rate, Modal, Input } from 'antd';
import { CloseOutlined, MenuOutlined, CommentOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { useEditorStore } from '../../../stores/editorStore';
import { QUESTION_LEVELS } from '../../../utils/constants';
import type { Question } from '../../../types';
import styles from './SelectedQuestionsPanel.module.css';

function QuestionCard({ q, index }: { q: Question; index: number }) {
  const { removeQuestion, reorderQuestions, selectedQuestions, scores, setScore, setComment } = useEditorStore();
  const qs = scores[q.id];
  const [showAnswer, setShowAnswer] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState(qs?.comment || '');

  const saveComment = () => {
    setComment(q.id, commentText);
    setCommentOpen(false);
  };

  return (
    <div className={styles.questionCard}>
      <div className={styles.questionRow}>
        <MenuOutlined className={styles.dragHandle} />
        <div className={styles.questionContent}>
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
            <Tag className={styles.tag}>{q.category.name}</Tag>
            {q.level && <Tag color="blue" className={styles.tag}>{QUESTION_LEVELS.find(l => l.value === q.level)?.label}</Tag>}
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
              <Button type="link" size="small" icon={<CommentOutlined />} onClick={() => { setCommentText(qs?.comment || ''); setCommentOpen(true); }}>
                Комментарий
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
      <Modal title="Комментарий" open={commentOpen} onCancel={() => setCommentOpen(false)} onOk={saveComment}>
        <Input.TextArea rows={4} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Введите комментарий..." />
      </Modal>
    </div>
  );
}

export function SelectedQuestionsPanel() {
  const { selectedQuestions, addQuestion } = useEditorStore();
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
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
      className={styles.card}
      styles={{
        body: {
          flex: 1,
          overflow: 'auto',
          padding: 8,
          ...(isEmpty ? { display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}),
        },
      }}
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`${styles.dropZone} ${dragOver ? styles.dropZoneOver : styles.dropZoneDefault}`}
      >
        {isEmpty ? (
          <Empty description="Перетащите вопросы сюда или добавьте кнопкой" />
        ) : (
          selectedQuestions.map((q, i) => <QuestionCard key={q.id} q={q} index={i} />)
        )}
      </div>
    </Card>
  );
}
