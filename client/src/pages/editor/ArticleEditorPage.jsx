import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { Check, Save, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import * as articlesApi from '../../api/articles.api';
import * as categoriesApi from '../../api/categories.api';
import { ARTICLE_TEMPLATES } from '../admin/TemplatesPage.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Select from '../../components/ui/Select.jsx';
import Input from '../../components/ui/Input.jsx';
import Label from '../../components/ui/Label.jsx';
import Button from '../../components/ui/Button.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import RichTextEditor from '../../components/forms/RichTextEditor.jsx';
import TagInput from '../../components/forms/TagInput.jsx';
import PageLoader from '../../components/common/PageLoader.jsx';
import { extractErrorMessage } from '../../api/axios';

export default function ArticleEditorPage() {
  const { slug } = useParams();
  const isEditing = !!slug;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState('write');
  const [tags, setTags] = useState([]);
  const [content, setContent] = useState(''); // Markdown, kept outside RHF since the editor is uncontrolled

  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: { title: '', template: 'how_to', category: '', module: '', product_version: '' },
  });

  const categoriesQuery = useQuery({ queryKey: ['categories', 'root'], queryFn: categoriesApi.getRootCategories });

  const articleQuery = useQuery({
    queryKey: ['article', slug],
    queryFn: () => articlesApi.getArticle(slug),
    enabled: isEditing,
  });

  // Wait for the article to load before mounting the editor so RichTextEditor's
  // initialContent seeds correctly (it's uncontrolled — see component comment).
  const ready = !isEditing || articleQuery.isSuccess;

  useEffect(() => {
    if (articleQuery.data) {
      const a = articleQuery.data;
      reset({
        title: a.title,
        template: a.content_type || 'how_to',
        category: a.category?.slug || '',
        module: a.module || '',
        product_version: a.product_version || '',
      });
      setContent(a.content || '');
      setTags((a.tags || []).map((t) => t.name || t));
    }
  }, [articleQuery.data, reset]);

  const activeTemplate = ARTICLE_TEMPLATES.find((t) => t.key === watch('template')) || ARTICLE_TEMPLATES[0];
  const categories = categoriesQuery.data?.results || categoriesQuery.data || [];

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      isEditing ? articlesApi.updateArticle(slug, payload) : articlesApi.createArticle(payload),
    onSuccess: (data) => {
      toast.success('Draft saved.');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      if (!isEditing && data?.slug) navigate(`/editor/articles/${data.slug}/edit`, { replace: true });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      const saved = isEditing
        ? await articlesApi.updateArticle(slug, payload)
        : await articlesApi.createArticle(payload);
      return articlesApi.submitForReview(saved.slug || slug);
    },
    onSuccess: () => {
      toast.success('Submitted for review.');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      navigate('/editor/submitted');
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const buildPayload = (values) => ({
    title: values.title,
    content_type: values.template,
    category: values.category,
    module: values.module,
    product_version: values.product_version,
    content,
    tags,
  });

  const onSaveDraft = handleSubmit((values) => saveMutation.mutate(buildPayload(values)));
  const onSubmitForReview = handleSubmit((values) => submitMutation.mutate(buildPayload(values)));

  if (!ready) return <PageLoader label="Loading article…" />;

  return (
    <div>
      <PageHeader
        title={watch('title') || (isEditing ? 'Edit Article' : 'New Article')}
        actions={
          <div className="flex items-center gap-3">
            <span className="text-xs text-success flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {saveMutation.isSuccess ? 'Saved' : 'Autosave ready'}
            </span>
            <Button variant="secondary" onClick={onSaveDraft} isLoading={saveMutation.isPending}>
              <Save className="w-4 h-4" /> Save Draft
            </Button>
            <Button onClick={onSubmitForReview} isLoading={submitMutation.isPending}>
              <Send className="w-4 h-4" /> Submit for Review
            </Button>
          </div>
        }
      />

      <Input
        placeholder="Article title..."
        className="!h-12 !text-lg font-semibold mb-6"
        {...register('title', { required: true })}
      />

      <div className="grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Sidebar: metadata */}
        <aside className="space-y-5">
          <div>
            <Label>Template</Label>
            <Select {...register('template')}>
              {ARTICLE_TEMPLATES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Category</Label>
            <Select {...register('category')}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Module</Label>
            <Input placeholder="e.g. Patient Registry" {...register('module')} />
          </div>
          <div>
            <Label>Product Version</Label>
            <Input placeholder="e.g. v3.1" {...register('product_version')} />
          </div>
          <div>
            <Label>Tags</Label>
            <TagInput tags={tags} onChange={setTags} />
          </div>
          <div>
            <Label>Sections ({activeTemplate.name})</Label>
            <div className="space-y-1">
              {activeTemplate.sections.map((s) => (
                <div key={s} className="flex items-center gap-2 text-sm text-text-secondary py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Editor */}
        <div className="bg-white border border-border rounded-card overflow-hidden">
          <Tabs
            className="px-2"
            active={view}
            onChange={setView}
            tabs={[
              { value: 'write', label: '✏️ Write' },
              { value: 'preview', label: '👁️ Preview' },
            ]}
          />

          {view === 'write' ? (
            <RichTextEditor
              key={slug || 'new'}
              initialContent={content}
              onChange={setContent}
              placeholder="Start writing your article… use the toolbar for headings, lists, tables, images, and callouts."
            />
          ) : (
            <div className="p-8 kb-prose max-w-article">
              <ReactMarkdown>{content || '*Nothing to preview yet.*'}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
