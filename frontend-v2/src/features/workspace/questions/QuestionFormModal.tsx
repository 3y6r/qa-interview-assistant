import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../../../api/categories';
import { tagsApi } from '../../../api/tags';
import { productsApi } from '../../../api/products';
import { QUESTION_LEVELS } from '../../../utils/constants';
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

type ManagerTarget = 'categories' | 'tags' | 'products' | null;

export function QuestionFormModal({ open, editingQuestion, onClose, onSubmit, loading }: Props) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [managerTarget, setManagerTarget] = useState<ManagerTarget>(null);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.list });
  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: productsApi.list });

  useEffect(() => {
    if (open) {
      if (editingQuestion) {
        form.setFieldsValue({
          text: editingQuestion.text,
          expectedAnswer: editingQuestion.expectedAnswer,
          categoryId: editingQuestion.category.id,
          level: editingQuestion.level,
          tagIds: editingQuestion.tags.map(t => t.id),
          product: editingQuestion.product,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editingQuestion, form]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['tags'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const catCreate = useMutation({ mutationFn: categoriesApi.create, onSuccess: invalidate });
  const catUpdate = useMutation({ mutationFn: ({ id, data }: { id: number; data: { name: string } }) => categoriesApi.update(id, data), onSuccess: invalidate });
  const catDelete = useMutation({ mutationFn: categoriesApi.delete, onSuccess: invalidate });

  const tagCreate = useMutation({ mutationFn: tagsApi.create, onSuccess: invalidate });
  const tagUpdate = useMutation({ mutationFn: ({ id, data }: { id: number; data: { name: string; color?: string } }) => tagsApi.update(id, data), onSuccess: invalidate });
  const tagDelete = useMutation({ mutationFn: tagsApi.delete, onSuccess: invalidate });

  const prodCreate = useMutation({ mutationFn: productsApi.create, onSuccess: invalidate });
  const prodUpdate = useMutation({ mutationFn: ({ id, data }: { id: number; data: { name: string } }) => productsApi.update(id, data), onSuccess: invalidate });
  const prodDelete = useMutation({ mutationFn: productsApi.delete, onSuccess: invalidate });

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
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="expectedAnswer" label="Ожидаемый ответ" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="categoryId" label={labelWithButton('Категория', 'categories')} rules={[{ required: true }]}>
            <Select options={categories.map((c: any) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="level" label="Грейд">
            <Select allowClear placeholder="Не выбран" options={QUESTION_LEVELS.map(l => ({ value: l.value, label: l.label }))} />
          </Form.Item>
          <Form.Item name="product" label={labelWithButton('Продукт', 'products')}>
            <Select allowClear placeholder="Не выбран" options={products.map((p: any) => ({ value: p.name, label: p.name }))} />
          </Form.Item>
          <Form.Item name="tagIds" label={labelWithButton('Теги', 'tags')}>
            <Select mode="multiple" options={tags.map((t: any) => ({ value: t.id, label: t.name }))} />
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
        onDelete={(id) => catDelete.mutate(id)}
      />

      <EntityManagerModal
        open={managerTarget === 'tags'}
        title="Управление тегами"
        items={tags}
        onClose={() => setManagerTarget(null)}
        onCreate={(name, color) => tagCreate.mutate({ name, color })}
        onUpdate={(id, name, color) => tagUpdate.mutate({ id, data: { name, color: color || '#108ee9' } })}
        onDelete={(id) => tagDelete.mutate(id)}
        showColor
      />

      <EntityManagerModal
        open={managerTarget === 'products'}
        title="Управление продуктами"
        items={products}
        onClose={() => setManagerTarget(null)}
        onCreate={(name) => prodCreate.mutate({ name })}
        onUpdate={(id, name) => prodUpdate.mutate({ id, data: { name } })}
        onDelete={(id) => prodDelete.mutate(id)}
      />
    </>
  );
}
