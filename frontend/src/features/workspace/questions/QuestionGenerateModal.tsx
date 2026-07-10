import { useState } from 'react';
import { Modal, Form, Select, InputNumber, Input, Button, List, Tag, message, Space, Checkbox } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { questionsApi } from '../../../api/questions';
import { categoriesApi } from '../../../api/categories';
import { tagsApi } from '../../../api/tags';
import { levelsApi } from '../../../api/levels';
import { LEVELS_QUERY_KEY } from '../../../utils/constants';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface GeneratedQuestion {
  text: string;
  expectedAnswer: string;
  categoryId: number;
  categoryName: string;
  levelId: number;
  levelName: string;
  tags: { id: number; name: string }[];
}

export function QuestionGenerateModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [generated, setGenerated] = useState<GeneratedQuestion[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: categoriesApi.list });
  const { data: allTags = [] } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.list });
  const { data: levels = [] } = useQuery({ queryKey: [LEVELS_QUERY_KEY], queryFn: levelsApi.list });

  const generateMutation = useMutation({
    mutationFn: (values: any) => questionsApi.generate({
      categoryId: values.categoryId,
      levelId: values.levelId,
      tagIds: values.tagIds,
      numQuestions: values.numQuestions,
      additionalText: values.additionalText || undefined,
    }),
    onSuccess: (data) => {
      setGenerated(data.questions);
      setSelectedIndices(data.questions.map((_: any, i: number) => i));
      message.success(`Сгенерировано ${data.questions.length} вопросов`);
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Ошибка при генерации'),
  });

  const handleGenerate = () => {
    form.validateFields().then((values) => {
      setGenerated([]);
      generateMutation.mutate(values);
    });
  };

  const handleSaveSelected = async () => {
    const toSave = generated.filter((_, i) => selectedIndices.includes(i));
    if (toSave.length === 0) {
      message.warning('Выберите хотя бы один вопрос');
      return;
    }
    setSaving(true);
    try {
      for (const q of toSave) {
        await questionsApi.create({
          text: q.text,
          expectedAnswer: q.expectedAnswer,
          categoryId: q.categoryId,
          levelId: q.levelId,
          tagIds: q.tags.map(t => t.id),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      message.success(`Сохранено ${toSave.length} вопросов`);
      setGenerated([]);
      setSelectedIndices([]);
      onClose();
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
    if (selectedIndices.length === generated.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(generated.map((_, i) => i));
    }
  };

  const handleClose = () => {
    setGenerated([]);
    setSelectedIndices([]);
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="AI генерация вопросов"
      open={open}
      onCancel={handleClose}
      width={700}
      footer={
        generated.length > 0
          ? [
              <Button key="save" type="primary" icon={<PlusOutlined />} onClick={handleSaveSelected} loading={saving} disabled={selectedIndices.length === 0}>
                Добавить выбранные ({selectedIndices.length})
              </Button>,
              <Button key="close" onClick={handleClose}>Закрыть</Button>,
            ]
          : [
              <Button key="generate" type="primary" onClick={handleGenerate} loading={generateMutation.isPending}>
                Сгенерировать
              </Button>,
              <Button key="close" onClick={handleClose}>Закрыть</Button>,
            ]
      }
    >
      <Form form={form} layout="vertical" initialValues={{ numQuestions: 3 }}>
        <Form.Item name="categoryId" label="Категория" rules={[{ required: true }]}>
          <Select options={categories.map((c: any) => ({ value: c.id, label: c.name }))} />
        </Form.Item>
        <Form.Item name="levelId" label="Грейд" rules={[{ required: true }]}>
          <Select options={levels.map((l: any) => ({ value: l.id, label: l.name }))} />
        </Form.Item>
        <Form.Item name="tagIds" label="Теги">
          <Select mode="multiple" options={allTags.map((t: any) => ({ value: t.id, label: t.name }))} />
        </Form.Item>
        <Form.Item name="numQuestions" label="Количество вопросов">
          <InputNumber min={1} max={10} />
        </Form.Item>
        <Form.Item name="additionalText" label="Дополнительный контекст">
          <Input.TextArea rows={2} placeholder="Опишите тему или требования..." />
        </Form.Item>
      </Form>

      {generated.length > 0 && (
        <List
          header={
            <Space>
              <Checkbox
                checked={selectedIndices.length === generated.length}
                indeterminate={selectedIndices.length > 0 && selectedIndices.length < generated.length}
                onChange={toggleAll}
              />
              <strong>Сгенерированные вопросы ({generated.length})</strong>
            </Space>
          }
          dataSource={generated}
          renderItem={(q, i) => (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => toggleSelect(i)}
            >
              <Checkbox checked={selectedIndices.includes(i)} style={{ marginRight: 8 }} />
              <List.Item.Meta
                title={q.text}
                description={
                  <Space size={4} wrap>
                    <Tag>{q.categoryName}</Tag>
                    <Tag color="blue">{q.levelName}</Tag>
                    {q.tags.map(t => <Tag key={t.id}>{t.name}</Tag>)}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
}
