import { Modal, Form, Select, InputNumber, Input, Button, message } from 'antd';
import { useQuery, useMutation } from '@tanstack/react-query';
import { questionsApi } from '../../../api/questions';
import { categoriesApi } from '../../../api/categories';
import { tagsApi } from '../../../api/tags';
import { levelsApi } from '../../../api/levels';
import { LEVELS_QUERY_KEY } from '../../../utils/constants';

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
  onClose: () => void;
  onGenerated: (questions: GeneratedQuestion[], params: { categoryId: number; levelId: number; tagIds?: number[]; numQuestions: number; additionalText?: string }) => void;
}

export function QuestionGenerateModal({ open, onClose, onGenerated }: Props) {
  const [form] = Form.useForm();

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
    onSuccess: (data, variables) => {
      onGenerated(data.questions, {
        categoryId: variables.categoryId,
        levelId: variables.levelId,
        tagIds: variables.tagIds,
        numQuestions: variables.numQuestions,
        additionalText: variables.additionalText,
      });
      form.resetFields();
      onClose();
    },
    onError: (err: any) => message.error(err?.response?.data?.detail || 'Ошибка при генерации'),
  });

  const handleGenerate = () => {
    form.validateFields().then((values) => {
      generateMutation.mutate(values);
    });
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="AI генерация вопросов"
      open={open}
      onCancel={handleClose}
      width={700}
      footer={[
        <Button key="generate" type="primary" onClick={handleGenerate} loading={generateMutation.isPending}>
          Сгенерировать
        </Button>,
        <Button key="close" onClick={handleClose}>Закрыть</Button>,
      ]}
    >
      <Form form={form} layout="vertical" initialValues={{ numQuestions: 3 }}>
        <Form.Item name="categoryId" label="Категория" rules={[{ required: true }]}>
          <Select options={categories.filter((c: any) => !c.isArchived).map((c: any) => ({ value: c.id, label: c.name }))} />
        </Form.Item>
        <Form.Item name="levelId" label="Грейд" rules={[{ required: true }]}>
          <Select options={levels.map((l: any) => ({ value: l.id, label: l.name }))} />
        </Form.Item>
        <Form.Item name="tagIds" label="Теги">
          <Select mode="multiple" options={allTags.filter((t: any) => !t.isArchived).map((t: any) => ({ value: t.id, label: t.name }))} />
        </Form.Item>
        <Form.Item name="numQuestions" label="Количество вопросов">
          <InputNumber min={1} max={10} />
        </Form.Item>
        <Form.Item name="additionalText" label="Дополнительный контекст">
          <Input.TextArea rows={2} placeholder="Опишите тему или требования..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
