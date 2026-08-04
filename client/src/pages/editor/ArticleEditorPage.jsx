import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import MarkdownRenderer from '../../components/article/MarkdownRenderer.jsx';
import { Check, Save, Send, EyeIcon, PenTool, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import * as articlesApi from '../../api/articles.api';
import * as categoriesApi from '../../api/categories.api';
import * as productsApi from '../../api/products.api';
import * as mediaApi from '../../api/media.api';
import { ARTICLE_TEMPLATES } from '../admin/TemplatesPage.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Select from '../../components/ui/Select.jsx';
import Input from '../../components/ui/Input.jsx';
import Label from '../../components/ui/Label.jsx';
import Button from '../../components/ui/Button.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import RichTextEditor from '../../components/editor/RichTextEditor.jsx';
import TagInput from '../../components/forms/TagInput.jsx';
import MediaUploader from '../../components/editor/MediaUploader.jsx';
import PageLoader from '../../components/common/PageLoader.jsx';
import { extractErrorMessage } from '../../api/axios';

export default function ArticleEditorPage() {
  const { slug } = useParams();
  const isEditing = !!slug;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState('write');
  const [tags, setTags] = useState([]);
  const [content, setContent] = useState('');
  const [mediaItems, setMediaItems] = useState([]);
  const [stagedFiles, setStagedFiles] = useState([]);
  const [successModal, setSuccessModal] = useState({ open: false, message: '', action: null });

  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      title: '',
      template: 'how_to',
      category: '',
      product: '',
      module: '',
      product_version: '',
    },
  });

  const categoriesQuery = useQuery({ queryKey: ['categories', 'root'], queryFn: categoriesApi.getRootCategories });
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.listProducts({ status: 'true' }),
  });

  const articleQuery = useQuery({
    queryKey: ['article', slug],
    queryFn: () => articlesApi.getArticle(slug),
    enabled: isEditing,
  });

  const mediaQuery = useQuery({
    queryKey: ['article', slug, 'media'],
    queryFn: () => articlesApi.getArticleMedia(slug),
    enabled: isEditing,
  });

  useEffect(() => {
    if (articleQuery.data) {
      const a = articleQuery.data;
      reset({
        title: a.title,
        template: a.content_type || 'how_to',
        category: a.category?.slug || '',
        product: a.product?.slug || '',
        module: a.module || '',
        product_version: a.product_version || '',
      });
      setContent(a.content || '');
      setTags((a.tags || []).map((t) => t.name || t));
    }
  }, [articleQuery.data, reset]);

  useEffect(() => {
    if (mediaQuery.data) {
      setMediaItems(
        mediaQuery.data.map((m) => ({
          id: m.id,
          name: m.filename || m.name || 'Media file',
          size: m.size || 0,
          type: m.type || m.file_type || 'image',
          url: m.url || m.file_url,
          preview: m.url || m.file_url,
          uploading: false,
          uploaded: true,
          staged: false,
          error: null,
        }))
      );
    }
  }, [mediaQuery.data]);

  const ready = !isEditing || articleQuery.isSuccess;

  const activeTemplate = ARTICLE_TEMPLATES.find((t) => t.key === watch('template')) || ARTICLE_TEMPLATES[0];
  const categories = categoriesQuery.data?.results || categoriesQuery.data || [];
  const products = productsQuery.data?.results || productsQuery.data || [];

  // Upload staged files (now with articleId)
  const uploadStagedFiles = async (files, articleId) => {
    const uploadedIds = [];
    for (const file of files) {
      try {
        const data = await mediaApi.uploadMedia(file, articleId);
        if (data.id) {
          uploadedIds.push(data.id);
        }
      } catch (err) {
        toast.error(`Failed to upload ${file.name}: ${err.message}`);
        throw err;
      }
    }
    return uploadedIds;
  };

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      // Step 1: Save article without media to get ID
      let articleData;
      if (isEditing) {
        articleData = await articlesApi.updateArticle(slug, { ...payload, media_ids: [] });
      } else {
        articleData = await articlesApi.createArticle({ ...payload, media_ids: [] });
      }
      const articleId = articleData.id;

      // Step 2: Upload staged files with article ID
      if (stagedFiles.length > 0) {
        const mediaIds = await uploadStagedFiles(stagedFiles, articleId);
        setStagedFiles([]);
        setMediaItems((prev) =>
          prev.map((item) =>
            item.staged ? { ...item, uploaded: true, staged: false, uploading: false } : item
          )
        );
        // Step 3: Update article with media IDs
        const existingIds = mediaItems.filter((m) => m.uploaded && !m.staged).map((m) => m.id);
        const allIds = [...existingIds, ...mediaIds];
        await articlesApi.updateArticle(articleData.slug, { ...payload, media_ids: allIds });
        // Re-fetch to update media list
        queryClient.invalidateQueries({ queryKey: ['article', articleData.slug, 'media'] });
      }
      return articleData;
    },
    onSuccess: (data) => {
      toast.success('Draft saved.');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setSuccessModal({
        open: true,
        message: 'Your article has been saved as a draft.',
        action: () => {
          if (!isEditing && data?.slug) navigate(`/editor/articles/${data.slug}/edit`, { replace: true });
          setSuccessModal({ open: false, message: '', action: null });
        },
      });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const submitMutation = useMutation({
    mutationFn: async (payload) => {
      let articleData;
      if (isEditing) {
        articleData = await articlesApi.updateArticle(slug, { ...payload, media_ids: [] });
      } else {
        articleData = await articlesApi.createArticle({ ...payload, media_ids: [] });
      }
      const articleId = articleData.id;

      if (stagedFiles.length > 0) {
        const mediaIds = await uploadStagedFiles(stagedFiles, articleId);
        setStagedFiles([]);
        setMediaItems((prev) =>
          prev.map((item) =>
            item.staged ? { ...item, uploaded: true, staged: false, uploading: false } : item
          )
        );
        const existingIds = mediaItems.filter((m) => m.uploaded && !m.staged).map((m) => m.id);
        const allIds = [...existingIds, ...mediaIds];
        await articlesApi.updateArticle(articleData.slug, { ...payload, media_ids: allIds });
        queryClient.invalidateQueries({ queryKey: ['article', articleData.slug, 'media'] });
      }
      // Submit for review after saving
      return articlesApi.submitForReview(articleData.slug);
    },
    onSuccess: () => {
      toast.success('Submitted for review.');
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      setSuccessModal({
        open: true,
        message: 'Your article has been submitted for review. An admin will review it shortly.',
        action: () => {
          navigate('/editor/submitted');
          setSuccessModal({ open: false, message: '', action: null });
        },
      });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const handleUpload = (file) => {
    const id = Date.now().toString();
    const preview = URL.createObjectURL(file);
    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type === 'application/pdf' ? 'pdf' : 'other';
    const newItem = {
      id,
      name: file.name,
      size: file.size,
      type,
      preview,
      uploading: false,
      uploaded: false,
      staged: true,
      progress: 0,
      error: null,
    };
    setMediaItems((prev) => [...prev, newItem]);
    setStagedFiles((prev) => [...prev, file]);
  };

  const handleRemove = (id) => {
    const item = mediaItems.find((m) => m.id === id);
    if (item && item.uploaded && !item.staged) {
      articlesApi.deleteMedia(item.id).catch(() => {});
    }
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
    if (item && item.staged) {
      setStagedFiles((prev) => prev.filter((_, i) => i !== mediaItems.findIndex((m) => m.id === id)));
    }
  };

  const buildPayload = (values) => ({
    title: values.title,
    article_type: values.template,
    category: values.category,
    product: values.product,
    module: values.module,
    product_version: values.product_version,
    content,
    tags,
  });

  const onSaveDraft = handleSubmit((values) => saveMutation.mutate(buildPayload(values)));
  const onSubmitForReview = handleSubmit((values) => submitMutation.mutate(buildPayload(values)));

  const closeSuccessModal = () => {
    if (successModal.action) successModal.action();
    else setSuccessModal({ open: false, message: '', action: null });
  };

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
            <Label>Product</Label>
            <Select {...register('product')}>
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
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

          <div>
            <Label>Media</Label>
            <MediaUploader
              items={mediaItems}
              onUpload={handleUpload}
              onRemove={handleRemove}
              showStaged={true}
            />
          </div>
        </aside>

        <div className="bg-white border border-border rounded-card overflow-hidden">
          <Tabs
            className="px-2"
            active={view}
            onChange={setView}
            tabs={[
              { value: 'write', label: <><PenTool className="w-4 h-4" /> Write</> },
              { value: 'preview', label: <><EyeIcon className="w-4 h-4" /> Preview</> },
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
            <div className="p-8 max-w-article mx-auto">
              <MarkdownRenderer content={content || '*Nothing to preview yet.*'} />
            </div>
          )}
        </div>
      </div>

      {successModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">Success!</h3>
                  <p className="text-sm text-text-secondary">{successModal.message}</p>
                </div>
              </div>
              <button
                onClick={closeSuccessModal}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={closeSuccessModal} variant="primary">
                {successModal.action ? 'Continue' : 'Close'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}