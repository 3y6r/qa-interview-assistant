import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../../../api/categories';
import { tagsApi } from '../../../api/tags';
import { levelsApi } from '../../../api/levels';
import { LEVELS_QUERY_KEY } from '../../../utils/constants';
import { EntityManagerModal } from './EntityManagerModal';
import type { Question } from '../../../types';
import styles from './QuestionFormModal.module.css';

interface Props {
  open: boolean;
  editingQuestion: Question | null;
  onClose: () => void;
  onSubmit: (values: any) => void;
  loading?: boolean;
}

type ManagerTarget = 'categories' | 'tags' | null;

export function QuestionFormModal({ open, editingQuestion, onClose, onSubmit, loading }: Props) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [managerTarget, setManagerTarget] = useState<ManagerTarget>(null);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.list });
  const { data: levels = [] } = useQuery({ queryKey: [LEVELS_QUERY_KEY], queryFn: levelsApi.list });

  useEffect(() => {
    if (open) {
      if (editingQuestion) {
        form.setFieldsValue({
          text: editingQuestion.text,
          expectedAnswer: editingQuestion.expectedAnswer,
          categoryId: editingQuestion.categoryId,
          levelId: editingQuestion.levelId,
          tagIds: editingQuestion.tags.filter((t: any) => !t.isArchived).map(t => t.id),
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingQuestion, form]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['tags'] });
  };

  const catCreate = useMutation({ mutationFn: categoriesApi.create, onSuccess: invalidate });
  const catUpdate = useMutation({ mutationFn: ({ id, data }: { id: number; data: { name: string } }) => categoriesApi.update(id, data), onSuccess: invalidate });
  const catArchive = useMutation({ mutationFn: categoriesApi.archive, onSuccess: invalidate });
  const catUnarchive = useMutation({ mutationFn: categoriesApi.unarchive, onSuccess: invalidate });

  const tagCreate = useMutation({ mutationFn: tagsApi.create, onSuccess: invalidate });
  const tagUpdate = useMutation({ mutationFn: ({ id, data }: { id: number; data: { name: string; color?: string } }) => tagsApi.update(id, data), onSuccess: invalidate });
  const tagArchive = useMutation({ mutationFn: tagsApi.archive, onSuccess: invalidate });
  const tagUnarchive = useMutation({ mutationFn: tagsApi.unarchive, onSuccess: invalidate });

  const handleOk = () => form.submit();

  const labelWithButton = (text: string, target: ManagerTarget) => (
    <span className={styles.labelWithIcon}>
      {text}
      <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => setManagerTarget(target)} className={styles.manageBtn} />
    </span>
  );

  return (
    <>
      <Modal
        title={editingQuestion ? 'Редактировать вопрос' : 'Новый вопрос'}
        open={open}
        onCancel={onClose}
        onOk={handleOk}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="text" label="Вопрос" rules={[{ required: true }]}>
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>
          <Form.Item name="expectedAnswer" label="Ожидаемый ответ" rules={[{ required: true }]}>
            <Input.TextArea rows={3} maxLength={1000} showCount />
          </Form.Item>
          <Form.Item name="categoryId" label={labelWithButton('Категория', 'categories')} rules={[{ required: true }]}>
            <Select options={categories.filter((c: any) => !c.isArchived).map((c: any) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="levelId" label="Грейд" rules={[{ required: true }]}>
            <Select allowClear placeholder="Не выбран" options={levels.map((l: any) => ({ value: l.id, label: l.name }))} />
          </Form.Item>
          <Form.Item name="tagIds" label={labelWithButton('Теги', 'tags')}>
            <Select mode="multiple" options={tags.filter((t: any) => !t.isArchived).map((t: any) => ({ value: t.id, label: t.name }))} />
          </Form.Item>
        </Form>
      </Modal>

      <EntityManagerModal
        open={managerTarget === 'categories'}
        title="Управление категориями"
        items={categories}
        onClose={() => setManagerTarget(null)}
        onCreate={(name) => catCreate.mutate({ name })}
        onUpdate={(id, name) => catUpdate.mutate({ id, data: { name } })}
        onArchive={(id) => catArchive.mutate(id)}
        onUnarchive={(id) => catUnarchive.mutate(id)}
        itemType="category"
      />

      <EntityManagerModal
        open={managerTarget === 'tags'}
        title="Управление тегами"
        items={tags}
        onClose={() => setManagerTarget(null)}
        onCreate={(name, color) => tagCreate.mutate({ name, color })}
        onUpdate={(id, name, color) => tagUpdate.mutate({ id, data: { name, color: color || '#108ee9' } })}
        onArchive={(id) => tagArchive.mutate(id)}
        onUnarchive={(id) => tagUnarchive.mutate(id)}
        showColor
        itemType="tag"
      />
    </>
  );
}
