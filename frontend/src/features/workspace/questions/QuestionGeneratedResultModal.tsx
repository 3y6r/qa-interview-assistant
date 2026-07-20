import { useState } from 'react';
import { Modal, List, Tag, Button, Space, Descriptions, Checkbox, message } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { questionsApi } from '../../../api/questions';
import { categoriesApi } from '../../../api/categories';
import { tagsApi } from '../../../api/tags';
import { levelsApi } from '../../../api/levels';
import { LEVELS_QUERY_KEY } from '../../../utils/constants';
import { QuestionFormModal } from './QuestionFormModal';
import type { Question } from '../../../types';
import styles from './QuestionGeneratedResultModal.module.css';

interface GeneratedQuestion {
  text: string;
  expectedAnswer: string;
  categoryId: number;
  categoryName: string;
  levelId: number;
  levelName: string;
  tags: { id: number; name: string }[];
}

interface Props {
  open: boolean;
  questions: GeneratedQuestion[];
  params: {
    categoryId: number;
    levelId: number;
    tagIds?: number[];
    numQuestions: number;
    additionalText?: string;
  };
  onClose: () => void;
  onSaved: () => void;
}

export function QuestionGeneratedResultModal({ open, questions, params, onClose, onSaved }: Props) {
  const queryClient = useQueryClient();
  const [selectedIndices, setSelectedIndices] = useState<number[]>(questions.map((_, i) => i));
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const { data: allTags = [] } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.list });
  const { data: levels = [] } = useQuery({ queryKey: [LEVELS_QUERY_KEY], queryFn: levelsApi.list });

  const categoryName = categories.find((c: any) => c.id === params.categoryId)?.name ?? '—';
  const levelName = levels.find((l: any) => l.id === params.levelId)?.name ?? '—';
  const tagNames = params.tagIds?.map(id => allTags.find((t: any) => t.id === id)?.name).filter(Boolean) ?? [];

  const editingQuestion = editingIndex !== null ? {
    id: -1,
    text: questions[editingIndex].text,
    expectedAnswer: questions[editingIndex].expectedAnswer,
    categoryId: questions[editingIndex].categoryId,
    levelId: questions[editingIndex].levelId,
    isArchived: false,
    tags: questions[editingIndex].tags,
    createdAt: '',
    updatedAt: '',
  } as Question : null;

  const handleEditSubmit = (values: any) => {
    if (editingIndex === null) return;
    questions[editingIndex] = {
      ...questions[editingIndex],
      text: values.text,
      expectedAnswer: values.expectedAnswer,
      categoryId: values.categoryId,
      levelId: values.levelId,
      tags: allTags.filter((t: any) => values.tagIds?.includes(t.id)),
      categoryName: categories.find((c: any) => c.id === values.categoryId)?.name ?? questions[editingIndex].categoryName,
      levelName: levels.find((l: any) => l.id === values.levelId)?.name ?? questions[editingIndex].levelName,
    };
    setEditingIndex(null);
  };

  const handleSaveSelected = async () => {
    const toSave = questions.filter((_, i) => selectedIndices.includes(i));
    if (toSave.length === 0) {
      message.warning('Выберите хотя бы один вопрос');
      return;
    }
    setSaving(true);
    try {
      let generatedTagId: number;
      const existing = allTags.find((t: any) => t.name === 'Сгенерировано');
      if (existing) {
        generatedTagId = existing.id;
      } else {
        const created = await tagsApi.create({ name: 'Сгенерировано', color: '#873800' });
        generatedTagId = created.id;
        queryClient.invalidateQueries({ queryKey: ['tags'] });
      }
      for (const q of toSave) {
        await questionsApi.create({
          text: q.text,
          expectedAnswer: q.expectedAnswer,
          categoryId: q.categoryId,
          levelId: q.levelId,
          tagIds: [...new Set([...q.tags.map(t => t.id), generatedTagId])],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      message.success(`Сохранено ${toSave.length} вопросов`);
      onSaved();
    } catch {
      message.error('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedIndices(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleAll = () => {
    if (selectedIndices.length === questions.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(questions.map((_, i) => i));
    }
  };

  return (
    <>
      <Modal
        title="Сгенерированные вопросы"
        open={open}
        onCancel={onClose}
        width={700}
        style={{ marginTop: '-4vh' }}
        footer={[
          <Button key="save" type="primary" icon={<PlusOutlined />} onClick={handleSaveSelected} loading={saving} disabled={selectedIndices.length === 0}>
            Добавить выбранные ({selectedIndices.length})
          </Button>,
          <Button key="close" onClick={onClose}>Закрыть</Button>,
        ]}
      >
        <div className={styles.modalBody}>
          <Descriptions size="small" column={3} className={styles.params}>
            <Descriptions.Item label="Категория">{categoryName}</Descriptions.Item>
            <Descriptions.Item label="Грейд">{levelName}</Descriptions.Item>
            <Descriptions.Item label="Кол-во">{params.numQuestions}</Descriptions.Item>
            {tagNames.length > 0 && (
              <Descriptions.Item label="Теги" span={3}>
                <Space size={4} wrap>
                  {tagNames.map((name, i) => <Tag key={i}>{name}</Tag>)}
                </Space>
              </Descriptions.Item>
            )}
            {params.additionalText && (
              <Descriptions.Item label="Контекст" span={3}>
                {params.additionalText}
              </Descriptions.Item>
            )}
          </Descriptions>

          <div className={styles.listHeader}>
            <Checkbox
              checked={selectedIndices.length === questions.length}
              indeterminate={selectedIndices.length > 0 && selectedIndices.length < questions.length}
              onChange={toggleAll}
            />
            <span className={styles.listTitle}>Вопросы ({questions.length})</span>
          </div>

          <div className={styles.listScroll}>
            <List
              dataSource={questions}
              renderItem={(q, i) => (
                <List.Item
                  className={styles.listItem}
                  actions={[
                    <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => setEditingIndex(i)}>
                      Редактировать
                    </Button>,
                  ]}
                >
                  <Checkbox
                    checked={selectedIndices.includes(i)}
                    onClick={() => toggleSelect(i)}
                    style={{ marginRight: 12 }}
                  />
                  <List.Item.Meta
                    title={q.text}
                    description={
                      <>
                        <div className={styles.answer}>{q.expectedAnswer}</div>
                        <Space size={4} wrap className={styles.tags}>
                          <Tag>{q.categoryName}</Tag>
                          <Tag color="blue">{q.levelName}</Tag>
                          {q.tags.map(t => <Tag key={t.id} color={(t as any).color || '#108ee9'}>{t.name}</Tag>)}
                        </Space>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        </div>
      </Modal>

      <QuestionFormModal
        open={editingIndex !== null}
        editingQuestion={editingQuestion}
        onClose={() => setEditingIndex(null)}
        onSubmit={handleEditSubmit}
      />
    </>
  );
}
