import { useState, useCallback } from 'react';
import { Card, Input, Select, Space, Button, List, Tag, Empty, message, Popconfirm, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionsApi } from '../../../api/questions';
import { categoriesApi } from '../../../api/categories';
import { tagsApi } from '../../../api/tags';
import { productsApi } from '../../../api/products';
import { useEditorStore } from '../../../stores/editorStore';
import { QUESTION_LEVELS } from '../../../utils/constants';
import { QuestionFormModal } from './QuestionFormModal';
import type { Question } from '../../../types';
import styles from './QuestionList.module.css';

export function QuestionList() {
  const queryClient = useQueryClient();
  const { addQuestion, selectedQuestions } = useEditorStore();
  const [text, setText] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [level, setLevel] = useState<string | undefined>();
  const [product, setProduct] = useState<string | undefined>();
  const [tagIds, setTagIds] = useState<number[] | undefined>();
  const [formModal, setFormModal] = useState<{ open: boolean; question: Question | null }>({ open: false, question: null });

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const { data: allTags = [] } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.list });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: productsApi.list });

  const { data, isLoading } = useQuery({
    queryKey: ['questions', text, categoryId, level, product, tagIds],
    queryFn: () => questionsApi.list({ text: text || undefined, categoryId, level, product: product || undefined, tagIds, size: 50 }),
  });

  const questions = data?.items || [];
  const selectedIds = new Set(selectedQuestions.map(q => q.id));

  const createMutation = useMutation({
    mutationFn: (values: any) => questionsApi.create(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      message.success('Вопрос создан');
      setFormModal({ open: false, question: null });
    },
    onError: () => message.error('Ошибка при создании'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => questionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      message.success('Вопрос обновлён');
      setFormModal({ open: false, question: null });
    },
    onError: () => message.error('Ошибка при обновлении'),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => questionsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      message.success('Вопрос архивирован');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => questionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      message.success('Вопрос удалён');
    },
  });

  const handleDragStart = useCallback((e: React.DragEvent, q: Question) => {
    e.dataTransfer.setData('application/json', JSON.stringify(q));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleFormSubmit = (values: any) => {
    if (formModal.question) {
      updateMutation.mutate({ id: formModal.question.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <>
      <Card title="Список вопросов" className={styles.card} styles={{ body: { overflow: 'auto', height: 'calc(100% - 56px)' } }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space className={styles.filtersRow}>
            <Input
              placeholder="Поиск"
              prefix={<SearchOutlined />}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={styles.filterInput}
              allowClear
            />
            <Select
              placeholder="Категория"
              value={categoryId}
              onChange={setCategoryId}
              allowClear
              className={styles.filterSelect}
              options={categories.map((c: any) => ({ value: c.id, label: c.name }))}
            />
            <Select
              placeholder="Уровень"
              value={level}
              onChange={setLevel}
              allowClear
              className={styles.filterLevel}
              options={QUESTION_LEVELS.map(l => ({ value: l.value, label: l.label }))}
            />
            <Select
              placeholder="Продукт"
              value={product}
              onChange={setProduct}
              allowClear
              className={styles.filterSelect}
              options={products.map((p: any) => ({ value: p.name, label: p.name }))}
            />
            <Select
              mode="multiple"
              placeholder="Теги"
              value={tagIds}
              onChange={setTagIds}
              allowClear
              className={styles.filterTags}
              options={allTags.map((t: any) => ({ value: t.id, label: t.name }))}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormModal({ open: true, question: null })} className={styles.createBtn}>
              Создать
            </Button>
          </Space>
          {questions.length === 0 && !isLoading ? (
            <Empty description="Нет вопросов" className={styles.emptyState} />
          ) : (
            <List
              loading={isLoading}
              dataSource={questions}
              renderItem={(q: Question) => {
                const isSelected = selectedIds.has(q.id);
                return (
                  <List.Item
                    key={q.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, q)}
                    className={`${styles.listItem} ${isSelected ? styles.listItemSelected : styles.listItemUnselected}`}
                    actions={[
                      <Tooltip key="add" title="Добавить к собеседованию">
                        <Button type="link" icon={<PlusOutlined />} disabled={isSelected} onClick={() => addQuestion(q)} />
                      </Tooltip>,
                      <Tooltip key="edit" title="Редактировать">
                        <Button type="link" icon={<EditOutlined />} onClick={() => setFormModal({ open: true, question: q })} />
                      </Tooltip>,
                      <Popconfirm key="archive" title="Архивировать вопрос?" onConfirm={() => archiveMutation.mutate(q.id)}>
                        <Tooltip title="Архивировать">
                          <Button type="link" icon={<InboxOutlined />} />
                        </Tooltip>
                      </Popconfirm>,
                      <Popconfirm key="delete" title="Удалить вопрос?" onConfirm={() => deleteMutation.mutate(q.id)}>
                        <Tooltip title="Удалить">
                          <Button type="link" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <span>{q.text}</span>
                        </Space>
                      }
                      description={
                        <Space size={4} wrap>
                          <Tag>{q.category.name}</Tag>
                          {q.level && <Tag color="blue">{QUESTION_LEVELS.find(l => l.value === q.level)?.label}</Tag>}
                          {q.product && <Tag color="purple">{q.product}</Tag>}
                          {q.tags.map(t => <Tag key={t.id} color={t.color || '#108ee9'}>{t.name}</Tag>)}
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </Space>
      </Card>
      <QuestionFormModal
        open={formModal.open}
        editingQuestion={formModal.question}
        onClose={() => setFormModal({ open: false, question: null })}
        onSubmit={handleFormSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
    </>
  );
}
