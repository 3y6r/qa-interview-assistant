import { useState, useCallback } from 'react';
import { Card, Input, Select, Space, Button, List, Tag, Empty, message, Popconfirm, Tooltip, Dropdown } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, InboxOutlined, DeleteOutlined, UnorderedListOutlined, ThunderboltOutlined, CheckOutlined, DownOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { questionsApi } from '../../../api/questions';
import { categoriesApi } from '../../../api/categories';
import { tagsApi } from '../../../api/tags';
import { levelsApi } from '../../../api/levels';
import { useEditorStore } from '../../../stores/editorStore';
import { LEVELS_QUERY_KEY } from '../../../utils/constants';
import { QuestionFormModal } from './QuestionFormModal';
import { QuestionGenerateModal } from './QuestionGenerateModal';
import type { Question } from '../../../types';
import styles from './QuestionList.module.css';

export function QuestionList() {
  const queryClient = useQueryClient();
  const { addQuestion, selectedQuestions } = useEditorStore();
  const [text, setText] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [levelId, setLevelId] = useState<number | undefined>();
  const [tagIds, setTagIds] = useState<number[] | undefined>();
  const [formModal, setFormModal] = useState<{ open: boolean; question: Question | null }>({ open: false, question: null });
  const [showArchived, setShowArchived] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const { data: allTags = [] } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.list });
  const { data: levels = [] } = useQuery({ queryKey: [LEVELS_QUERY_KEY], queryFn: levelsApi.list });

  const levelMap = new Map(levels.map((l: any) => [l.id, l.name]));

  const LIMIT = 20;

  const {
    data: questionsPages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['questions', text, categoryId, levelId, tagIds, showArchived],
    queryFn: ({ pageParam = 0 }) =>
      questionsApi.list({ text: text || undefined, categoryId, levelId, tagIds, isArchived: showArchived, limit: LIMIT, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < LIMIT ? undefined : allPages.length * LIMIT;
    },
  });

  const questions = questionsPages?.pages.flat() ?? [];

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

  const unarchiveMutation = useMutation({
    mutationFn: (id: number) => questionsApi.unarchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      message.success('Вопрос восстановлен из архива');
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
    const el = e.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const ghost = document.createElement('div');
    ghost.style.cssText = `
      padding: 8px 12px;
      background: #fafafa;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
      box-shadow: 0 6px 16px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      width: ${rect.width}px;
      position: absolute;
      top: -10000px;
      left: -10000px;
      pointer-events: none;
    `;
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:flex-start;gap:8px;';
    const dragHandle = document.createElement('span');
    dragHandle.textContent = '⠿';
    dragHandle.style.cssText = 'color:#999;font-size:14px;margin-top:5px;flex-shrink:0;line-height:1;';
    row.appendChild(dragHandle);
    const content = document.createElement('div');
    content.style.cssText = 'flex:1;min-width:0;';
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;';
    const origTitle = el.querySelector('.ant-list-item-meta-title');
    const textSpan = origTitle
      ? (origTitle.cloneNode(true) as HTMLElement)
      : document.createElement('span');
    if (!origTitle) textSpan.textContent = q.text;
    textSpan.style.cssText = (textSpan.style.cssText || '') + ';flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    header.appendChild(textSpan);
    const actionsWrap = document.createElement('span');
    actionsWrap.style.cssText = 'display:inline-flex;align-items:center;gap:6px;flex-shrink:0;margin-left:8px;margin-top:30px;';
    const origActions = el.querySelector('ul');
    if (origActions) {
      Array.from(origActions.querySelectorAll('li')).forEach(li => {
        const cloneLi = li.cloneNode(true) as HTMLElement;
        cloneLi.style.cssText = 'display:inline-flex;align-items:center;list-style:none;';
        const btn = cloneLi.querySelector('button');
        if (btn) btn.style.cssText = btn.style.cssText + ';font-size:16px;';
        actionsWrap.appendChild(cloneLi);
      });
    }
    header.appendChild(actionsWrap);
    content.appendChild(header);
    const tagsRow = document.createElement('div');
    tagsRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin:4px 0;';
    const origDesc = el.querySelector('.ant-list-item-meta-description');
    if (origDesc) {
      Array.from(origDesc.children).forEach(child => {
        const clone = child.cloneNode(true) as HTMLElement;
        tagsRow.appendChild(clone);
      });
    }
    content.appendChild(tagsRow);
    row.appendChild(content);
    ghost.appendChild(row);
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, e.clientX - rect.left, e.clientY - rect.top);
    requestAnimationFrame(() => document.body.removeChild(ghost));
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
      <Card title="Список вопросов" className={styles.card} styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100% - 56px)' } }}>
        <div className={styles.filtersRow}>
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
            options={categories.filter((c: any) => !c.isArchived).map((c: any) => ({ value: c.id, label: c.name }))}
          />
          <Select
            placeholder="Уровень"
            value={levelId}
            onChange={setLevelId}
            allowClear
            className={styles.filterLevel}
            options={levels.map((l: any) => ({ value: l.id, label: l.name }))}
          />
          <Dropdown
            trigger={['click']}
            placement="bottomLeft"
            dropdownRender={() => (
              <div className={styles.tagsDropdown}>
                {allTags.filter((tag: any) => !tag.isArchived).map((tag: any) => {
                  const selected = tagIds?.includes(tag.id);
                  return (
                    <div
                      key={tag.id}
                      className={`${styles.tagOption} ${selected ? styles.tagOptionSelected : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setTagIds((prev) => {
                          if (prev?.includes(tag.id)) {
                            const next = prev.filter((id) => id !== tag.id);
                            return next.length ? next : undefined;
                          }
                          return [...(prev || []), tag.id];
                        });
                      }}
                    >
                      <span className={styles.tagOptionCheck}>
                        {selected && <CheckOutlined />}
                      </span>
                      <Tag color={tag.color || '#108ee9'} className={styles.tagOptionTag}>
                        {tag.name}
                      </Tag>
                    </div>
                  );
                })}
              </div>
            )}
          >
            <div className={styles.customSelect}>
              <div className={styles.tagsScrollContainer}>
                {tagIds && tagIds.length > 0 ? (
                  tagIds.map((id) => {
                    const tag = allTags.find((t: any) => t.id === id);
                    if (!tag) return null;
                    return (
                      <Tag
                        key={id}
                        closable
                        onClose={(e) => {
                          e.stopPropagation();
                          setTagIds((prev) => {
                            const next = prev?.filter((t) => t !== id);
                            return next?.length ? next : undefined;
                          });
                        }}
                        className={styles.tagChip}
                        color={tag.color || '#108ee9'}
                      >
                        {tag.name}
                      </Tag>
                    );
                  })
                ) : (
                  <span className={styles.placeholder}>Теги</span>
                )}
              </div>
              <span className={styles.selectArrow}><DownOutlined /></span>
            </div>
          </Dropdown>

          <div style={{ flex: 1 }} />
          <Button icon={<UnorderedListOutlined />} onClick={() => setShowArchived(v => !v)} type={showArchived ? 'primary' : 'default'}>
            Архив
          </Button>
          <Button icon={<ThunderboltOutlined />} onClick={() => setGenerateOpen(true)}>
            AI
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setFormModal({ open: true, question: null })}>
            Создать
          </Button>
        </div>
        <div className={styles.listWrapper}>
          {questions.length === 0 && !isLoading ? (
            <Empty description="Нет вопросов" className={styles.emptyState} />
          ) : (
            <List
              loading={isLoading}
              dataSource={questions}
              renderItem={(q: Question) => {
                const isSelected = selectedIds.has(q.id);
                const cat = categories.find((c: any) => c.id === q.categoryId);
                const levelName = q.levelId ? levelMap.get(q.levelId) : null;
                return (
                  <List.Item
                    key={q.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, q)}
                    style={{ paddingLeft: 16 }}
                    className={`${styles.listItem} ${isSelected ? styles.listItemSelected : styles.listItemUnselected}`}
                    actions={[
                      <Tooltip key="add" title="Добавить к собеседованию">
                        <Button type="link" icon={<PlusOutlined />} disabled={isSelected} onClick={() => addQuestion(q)} />
                      </Tooltip>,
                      <Tooltip key="edit" title="Редактировать">
                        <Button type="link" icon={<EditOutlined />} onClick={() => setFormModal({ open: true, question: q })} />
                      </Tooltip>,
                      (showArchived ? (
                        <Popconfirm key="unarchive" title="Восстановить вопрос?" onConfirm={() => unarchiveMutation.mutate(q.id)}>
                          <Tooltip title="Восстановить из архива">
                            <Button type="link" icon={<InboxOutlined />} />
                          </Tooltip>
                        </Popconfirm>
                      ) : (
                        <Popconfirm key="archive" title="Архивировать вопрос?" onConfirm={() => archiveMutation.mutate(q.id)}>
                          <Tooltip title="Архивировать">
                            <Button type="link" icon={<InboxOutlined />} />
                          </Tooltip>
                        </Popconfirm>
                      )),
                      <Popconfirm key="delete" title="Удалить вопрос?" onConfirm={() => deleteMutation.mutate(q.id)}>
                        <Tooltip title="Удалить">
                          <Button type="link" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <span className={styles.questionText}>{q.text}</span>
                      }
                      description={
                        <Space size={4} wrap>
                          {cat && !cat.isArchived && <Tag>{cat.name}</Tag>}
                          {levelName && <Tag color="blue">{levelName}</Tag>}
                          {q.tags.filter((t: any) => !t.isArchived).map(t => <Tag key={t.id} color={t.color || '#108ee9'}>{t.name}</Tag>)}
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
          {hasNextPage && (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <Button loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
                Загрузить еще
              </Button>
            </div>
          )}
        </div>
      </Card>
      <QuestionFormModal
        open={formModal.open}
        editingQuestion={formModal.question}
        onClose={() => setFormModal({ open: false, question: null })}
        onSubmit={handleFormSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />
      <QuestionGenerateModal
        open={generateOpen}
        onClose={() => setGenerateOpen(false)}
      />
    </>
  );
}
