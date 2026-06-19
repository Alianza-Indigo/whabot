import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatabaseZap, FileSearch, FileUp, RefreshCcw, Save, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { BotPicker } from '@/components/common/BotPicker';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { DataTable } from '@/components/common/DataTable';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { MetricCard } from '@/components/common/MetricCard';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/resources';
import type { KnowledgeItem } from '@/lib/types';

const knowledgeSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50_000),
  tagsText: z.string().optional(),
});
const INTERNAL_TAG_PREFIX = '__';
const IMPORT_SOURCE_TAG_PREFIX = `${INTERNAL_TAG_PREFIX}source:`;

type KnowledgeValues = z.infer<typeof knowledgeSchema>;

export function KnowledgePage() {
  const queryClient = useQueryClient();
  const botsQuery = useQuery({ queryKey: ['bots'], queryFn: api.bots });
  const [botId, setBotId] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [previewQuery, setPreviewQuery] = useState('');
  const [pdfInputKey, setPdfInputKey] = useState(0);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const knowledgeQuery = useQuery({ queryKey: ['knowledge', botId], queryFn: () => api.knowledge(botId), enabled: Boolean(botId) });

  useEffect(() => {
    if (!botId && botsQuery.data?.[0]) setBotId(botsQuery.data[0].id);
  }, [botId, botsQuery.data]);

  useEffect(() => {
    setSelectedItem(null);
    setSelectedDocument(null);
    setPreviewQuery('');
    setPdfInputKey((value) => value + 1);
  }, [botId]);

  useEffect(() => {
    if (!selectedItem) return;
    const refreshed = knowledgeQuery.data?.find((item) => item.id === selectedItem.id) ?? null;
    setSelectedItem(refreshed);
  }, [knowledgeQuery.data, selectedItem]);

  const createForm = useForm<KnowledgeValues>({
    resolver: zodResolver(knowledgeSchema),
    defaultValues: { title: '', content: '', tagsText: '' },
  });
  const editForm = useForm<KnowledgeValues>({
    resolver: zodResolver(knowledgeSchema),
    values: {
      title: selectedItem?.title ?? '',
      content: selectedItem?.content ?? '',
      tagsText: getEditableKnowledgeTags(selectedItem?.tags).join(', '),
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['knowledge', botId] });
  const createKnowledge = useMutation({
    mutationFn: (values: KnowledgeValues) => api.createKnowledge(botId, toPayload(values)),
    onSuccess: () => {
      createForm.reset({ title: '', content: '', tagsText: '' });
      invalidate();
    },
  });
  const updateKnowledge = useMutation({
    mutationFn: (values: KnowledgeValues) => api.updateKnowledge(botId, selectedItem!.id, toPayload(values, getHiddenKnowledgeTags(selectedItem?.tags))),
    onSuccess: (item) => {
      setSelectedItem(item);
      invalidate();
    },
  });
  const deleteKnowledge = useMutation({
    mutationFn: (itemId: string) => api.deleteKnowledge(botId, itemId),
    onSuccess: () => {
      setSelectedItem(null);
      invalidate();
    },
  });
  const deleteImport = useMutation({
    mutationFn: async (itemIds: string[]) => {
      for (const itemId of itemIds) {
        await api.deleteKnowledge(botId, itemId);
      }
    },
    onSuccess: () => {
      setSelectedItem(null);
      invalidate();
    },
  });
  const embedKnowledge = useMutation({
    mutationFn: () => api.embedKnowledge(botId),
    onSuccess: invalidate,
  });
  const previewKnowledge = useMutation({
    mutationFn: (query: string) => api.previewKnowledge(botId, query),
  });
  const uploadDocument = useMutation({
    mutationFn: (file: File) => api.uploadKnowledgeDocument(botId, file),
    onSuccess: () => {
      setSelectedDocument(null);
      setPdfInputKey((value) => value + 1);
      invalidate();
    },
  });

  const items = knowledgeQuery.data ?? [];
  const embedded = items.filter((item) => item.hasEmbedding).length;
  const importedSources = useMemo(() => groupImportedKnowledge(items), [items]);
  const columns = useMemo(
    () => [
      { key: 'title', header: 'Documento', render: (item: KnowledgeItem) => <button className="font-medium text-primary hover:underline" onClick={() => setSelectedItem(item)}>{item.title}</button> },
      { key: 'embedding', header: 'Embedding', render: (item: KnowledgeItem) => <StatusBadge status={item.hasEmbedding} /> },
      { key: 'tags', header: 'Tags', render: (item: KnowledgeItem) => getVisibleKnowledgeTags(item.tags).join(', ') || 'sin tags' },
      { key: 'content', header: 'Contenido', render: (item: KnowledgeItem) => <span className="line-clamp-2 max-w-lg text-muted-foreground">{item.content}</span> },
      {
        key: 'actions',
        header: '',
        render: (item: KnowledgeItem) => (
          <ConfirmDialog
            title="Eliminar knowledge item"
            description="El item y su embedding se eliminan del bot."
            confirmLabel="Eliminar"
            destructive
            onConfirm={() => deleteKnowledge.mutateAsync(item.id)}
          >
            <Button size="sm" variant="outline" type="button"><Trash2 className="h-4 w-4" /> Eliminar</Button>
          </ConfirmDialog>
        ),
      },
    ],
    [deleteKnowledge],
  );

  return (
    <>
      <PageHeader
        title="Knowledge / RAG"
        description="Base de conocimiento por agente. Soporta CRUD textual, carga de documentos y reindexado de embeddings."
        actions={
          <Button disabled={!botId || embedKnowledge.isPending} onClick={() => embedKnowledge.mutate()} type="button" variant="outline">
            <RefreshCcw className="h-4 w-4" /> Reindexar
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Items" value={items.length} icon={DatabaseZap} />
        <MetricCard title="Con embedding" value={`${embedded}/${items.length}`} />
        <MetricCard title="Pendientes" value={items.length - embedded} tone={items.length - embedded ? 'warning' : 'success'} />
        <MetricCard title="Importaciones" value={importedSources.length} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle>Agente</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <BotPicker value={botId} onChange={setBotId} />
            <div className="space-y-3 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Cargar archivo</p>
                <p className="text-xs text-muted-foreground">
                  Acepta pdf, docx, txt, csv, xlsx, xls, png, jpg, jpeg y webp. Las imagenes y los PDF escaneados usan OCR con el mismo provider, modelo y credencial que ya configuro el usuario en el bot.
                </p>
              </div>
              <Input
                key={pdfInputKey}
                accept=".pdf,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
                type="file"
                onChange={(event) => setSelectedDocument(event.target.files?.[0] ?? null)}
              />
              <Button disabled={!botId || !selectedDocument || uploadDocument.isPending} onClick={() => selectedDocument && uploadDocument.mutate(selectedDocument)} type="button">
                <FileUp className="h-4 w-4" /> Subir archivo
              </Button>
              {selectedDocument ? (
                <div className="text-xs text-muted-foreground">
                  Archivo seleccionado: {selectedDocument.name}
                </div>
              ) : null}
            </div>
            {uploadDocument.data ? (
              <div className="rounded-md border bg-emerald-50 p-3 text-sm text-emerald-800">
                Archivo {uploadDocument.data.sourceType.toUpperCase()} importado: {uploadDocument.data.created} items desde {uploadDocument.data.totalChunks} chunks, {uploadDocument.data.embedded} con embedding y {uploadDocument.data.failed} fallidos.
              </div>
            ) : null}
            {uploadDocument.isError ? <ErrorState error={uploadDocument.error} /> : null}
            {embedKnowledge.data ? (
              <div className="rounded-md border bg-emerald-50 p-3 text-sm text-emerald-800">
                Reindexado: {embedKnowledge.data.updated} actualizados, {embedKnowledge.data.failed} fallidos de {embedKnowledge.data.total}.
              </div>
            ) : null}
            {embedKnowledge.isError ? <ErrorState error={embedKnowledge.error} /> : null}
            <div className="space-y-3 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Probar recuperacion</p>
                <p className="text-xs text-muted-foreground">
                  Escribe una pregunta como la haria un cliente final y revisa que knowledge esta recuperando el backend.
                </p>
              </div>
              <Input
                placeholder="Ej. horarios de entrega en Chihuahua"
                value={previewQuery}
                onChange={(event) => setPreviewQuery(event.target.value)}
              />
              <Button
                disabled={!botId || !previewQuery.trim() || previewKnowledge.isPending}
                onClick={() => previewKnowledge.mutate(previewQuery.trim())}
                type="button"
                variant="outline"
              >
                <FileSearch className="h-4 w-4" /> Probar consulta
              </Button>
              {previewKnowledge.isError ? <ErrorState error={previewKnowledge.error} /> : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Vista previa de recuperacion</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {previewKnowledge.data ? (
                <>
                  <div className="rounded-md border bg-muted/40 p-3 text-sm">
                    <div><span className="font-medium">Consulta:</span> {previewKnowledge.data.query}</div>
                    <div><span className="font-medium">Metodo:</span> {describeRetrievalMode(previewKnowledge.data.mode)}</div>
                    <div><span className="font-medium">Items:</span> {previewKnowledge.data.total}</div>
                  </div>
                  {previewKnowledge.data.items.length ? previewKnowledge.data.items.map((item) => (
                    <button
                      className="block w-full rounded-md border p-3 text-left hover:bg-muted/40"
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      type="button"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="font-medium">{item.title}</div>
                        <StatusBadge status={item.hasEmbedding} />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {getVisibleKnowledgeTags(item.tags).join(', ') || 'sin tags'}
                      </div>
                      <div className="mt-2 line-clamp-4 text-sm text-muted-foreground">{item.content}</div>
                    </button>
                  )) : (
                    <EmptyState
                      title="Sin resultados"
                      description="Esta consulta no encontro chunks relevantes en la base de conocimiento."
                    />
                  )}
                </>
              ) : (
                <EmptyState
                  title="Sin prueba"
                  description="Corre una consulta de ejemplo para ver exactamente que knowledge esta trayendo el backend."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Importaciones</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {importedSources.length ? importedSources.map((source) => (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3" key={source.id}>
                  <div className="space-y-1">
                    <div className="font-medium">{source.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {source.itemCount} chunks, {source.embeddedCount} con embedding
                    </div>
                  </div>
                  <ConfirmDialog
                    title="Eliminar importacion"
                    description="Se eliminaran todos los chunks creados por este archivo."
                    confirmLabel="Eliminar"
                    destructive
                    onConfirm={() => deleteImport.mutateAsync(source.itemIds)}
                  >
                    <Button disabled={deleteImport.isPending} size="sm" type="button" variant="outline">
                      <Trash2 className="h-4 w-4" /> Eliminar archivo
                    </Button>
                  </ConfirmDialog>
                </div>
              )) : <EmptyState title="Sin importaciones" description="Los archivos que subas aqui quedaran agrupados para administrarlos mejor." />}
              {deleteImport.isError ? <ErrorState error={deleteImport.error} /> : null}
            </CardContent>
          </Card>

          <DataTable
            columns={columns}
            data={items}
            getRowKey={(item) => item.id}
            empty={<EmptyState title="Knowledge vacio" description="Agrega contenido textual para que el bot lo recupere durante la conversacion." />}
          />
        </div>
      </div>

      {knowledgeQuery.isError ? <div className="mt-4"><ErrorState error={knowledgeQuery.error} /></div> : null}

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Crear item</CardTitle></CardHeader>
          <CardContent>
            <KnowledgeForm form={createForm} onSubmit={(values) => createKnowledge.mutate(values)} isSubmitting={createKnowledge.isPending} />
            {createKnowledge.isError ? <div className="mt-3"><ErrorState error={createKnowledge.error} /></div> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Editar item</CardTitle></CardHeader>
          <CardContent>
            {selectedItem ? (
              <>
                <KnowledgeForm form={editForm} onSubmit={(values) => updateKnowledge.mutate(values)} isSubmitting={updateKnowledge.isPending} />
                {updateKnowledge.isError ? <div className="mt-3"><ErrorState error={updateKnowledge.error} /></div> : null}
              </>
            ) : (
              <EmptyState title="Selecciona un item" />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function KnowledgeForm({
  form,
  onSubmit,
  isSubmitting,
}: {
  form: ReturnType<typeof useForm<KnowledgeValues>>;
  onSubmit: (values: KnowledgeValues) => void;
  isSubmitting?: boolean;
}) {
  return (
    <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
      <Input placeholder="Titulo" {...form.register('title')} />
      <Input placeholder="tags separados por coma" {...form.register('tagsText')} />
      <Textarea rows={12} placeholder="Contenido" {...form.register('content')} />
      <Button disabled={isSubmitting} type="submit"><Save className="h-4 w-4" /> Guardar</Button>
    </form>
  );
}

function toPayload(values: KnowledgeValues, hiddenTags: string[] = []) {
  return {
    title: values.title,
    content: values.content,
    tags: [
      ...(values.tagsText?.split(',').map((tag) => tag.trim()).filter(Boolean) ?? []),
      ...hiddenTags,
    ],
  };
}

function getVisibleKnowledgeTags(tags?: string[]) {
  return (tags ?? []).filter((tag) => !tag.startsWith(INTERNAL_TAG_PREFIX));
}

function getEditableKnowledgeTags(tags?: string[]) {
  return getVisibleKnowledgeTags(tags);
}

function getHiddenKnowledgeTags(tags?: string[]) {
  return (tags ?? []).filter((tag) => tag.startsWith(INTERNAL_TAG_PREFIX));
}

function groupImportedKnowledge(items: KnowledgeItem[]) {
  const grouped = new Map<string, { id: string; title: string; itemIds: string[]; itemCount: number; embeddedCount: number }>();
  for (const item of items) {
    const sourceId = item.tags?.find((tag) => tag.startsWith(IMPORT_SOURCE_TAG_PREFIX))?.slice(IMPORT_SOURCE_TAG_PREFIX.length);
    if (!sourceId) continue;
    const existing = grouped.get(sourceId);
    if (existing) {
      existing.itemIds.push(item.id);
      existing.itemCount += 1;
      existing.embeddedCount += item.hasEmbedding ? 1 : 0;
      continue;
    }
    grouped.set(sourceId, {
      id: sourceId,
      title: item.title.replace(/ \(\d+\/\d+\)$/, ''),
      itemIds: [item.id],
      itemCount: 1,
      embeddedCount: item.hasEmbedding ? 1 : 0,
    });
  }
  return Array.from(grouped.values()).sort((a, b) => a.title.localeCompare(b.title, 'es'));
}

function describeRetrievalMode(mode: 'none' | 'keyword' | 'semantic' | 'vector') {
  switch (mode) {
    case 'vector':
      return 'vectorial';
    case 'semantic':
      return 'semantico';
    case 'keyword':
      return 'palabras clave';
    default:
      return 'sin coincidencias';
  }
}
