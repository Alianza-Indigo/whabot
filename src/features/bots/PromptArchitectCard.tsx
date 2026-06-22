import { zodResolver } from '@hookform/resolvers/zod';
import { BrainCircuit, CheckCircle2, FilePenLine, MessageSquareText, ShieldAlert, Sparkles, Wand2, Workflow } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Bot, PromptArchitectBlueprint, PromptArchitectDraftResponse } from '@/lib/types';

const objectiveOptions = {
  lead_capture: 'Captar prospectos y calificar su interes antes de pasarlos al equipo.',
  sales_closer: 'Atender consultas comerciales y empujar la conversacion hacia cotizacion o cierre.',
  support_firstline: 'Resolver preguntas frecuentes y soporte de primer nivel sin escalar todo.',
  booking: 'Agendar citas, demos o visitas con datos claros y confirmacion.',
  onboarding: 'Explicar el servicio, pedir datos iniciales y orientar los primeros pasos.',
  membership: 'Atender usuarios de membresia, explicar beneficios y empujar renovacion o pago.',
} as const;

const audienceOptions = {
  prospects: 'Prospectos nuevos que llegan por primera vez.',
  customers: 'Clientes activos que ya conocen el negocio.',
  members: 'Miembros o asociados con relacion continua.',
  patients: 'Pacientes o usuarios que requieren orientacion cuidadosa.',
  students: 'Alumnos o aspirantes que preguntan por inscripcion o seguimiento.',
} as const;

const toneOptions = {
  warm: 'Cercano, amable y facil de entender.',
  professional: 'Profesional, confiable y orientado a resolver.',
  executive: 'Directo, sobrio y eficiente.',
  premium: 'Consultivo, elegante y de alto valor percibido.',
  technical: 'Claro, tecnico y preciso sin sonar frio.',
} as const;

const industryOptions = {
  services: 'Negocio de servicios con conversacion consultiva y seguimiento.',
  retail: 'Venta de productos, catalogo y respuestas rapidas sobre compra.',
  clinic: 'Atencion delicada, ordenada y con fuerte criterio de escalamiento.',
  education: 'Informacion de programas, inscripciones y acompanamiento.',
  association: 'Comunicacion institucional, membresias, beneficios y eventos.',
  real_estate: 'Calificacion, agenda y seguimiento comercial estructurado.',
} as const;

const offeringOptions = {
  catalog: 'Maneja un catalogo de productos o paquetes con variantes.',
  service_quote: 'Explica servicios y detecta si se requiere cotizacion.',
  booking: 'Su principal accion es agendar cita, llamada o demo.',
  support: 'Su principal accion es resolver dudas y soporte operativo.',
  membership: 'Opera membresias, renovaciones, pagos o beneficios.',
} as const;

const flowOptions = {
  qualify_route: 'Abrir, descubrir necesidad, calificar y llevar al siguiente paso.',
  faq_then_handoff: 'Resolver preguntas frecuentes y escalar casos complejos.',
  book_confirm: 'Detectar interes, proponer horario y confirmar cita.',
  guided_sale: 'Entender contexto, sugerir opcion y buscar cierre o pago.',
  intake_triage: 'Recibir informacion, clasificar el caso y derivarlo con orden.',
} as const;

const escalationOptions = {
  complex_only: 'Escalar solo cuando el caso sea complejo, ambiguo o sensible.',
  on_request: 'Escalar cuando el usuario lo pida o cuando el bot no tenga certeza.',
  legal_payment: 'Escalar temas legales, pagos irregulares, reclamos o excepciones.',
  strict_human: 'Escalar cualquier negociacion delicada o compromiso relevante.',
} as const;

const scopeOptions = {
  no_promises: 'No prometer disponibilidad, tiempos o resultados no confirmados.',
  no_custom_price: 'No inventar precios, descuentos o condiciones especiales.',
  no_sensitive_advice: 'No dar consejo medico, legal o financiero como definitivo.',
  no_system_claims: 'No fingir acciones que no ha confirmado el sistema o el humano.',
} as const;

const knowledgeOptions = {
  grounded: 'Usar knowledge como fuente principal y admitir cuando falte informacion.',
  light: 'Usar knowledge solo como apoyo y priorizar respuestas breves.',
  strict: 'No responder fuera de lo documentado; si falta contexto, escalar.',
} as const;

const toolOptions = {
  none: 'Sin herramientas externas; solo conversacion y conocimiento.',
  crm: 'Puede capturar datos y preparar contexto para CRM o seguimiento.',
  booking: 'Puede apoyar agenda o coordinacion de citas.',
  payments: 'Puede orientar sobre pagos o membresias, sin fingir confirmacion.',
  mixed: 'Puede trabajar con CRM, agenda y pagos segun el caso.',
} as const;

const handoffOptions = {
  high_intent: 'Escalar cuando detecte alta intencion de compra o cierre.',
  frustrated_user: 'Escalar si el usuario muestra frustracion o insiste en humano.',
  special_case: 'Escalar cuando el caso salga del flujo previsto o requiera excepcion.',
  compliance: 'Escalar si aparece un riesgo de cumplimiento o datos sensibles.',
} as const;

const outputOptions = {
  concise: 'Respuestas cortas, claras y con una sola accion siguiente.',
  consultative: 'Respuestas algo mas guiadas, con contexto y recomendacion puntual.',
  structured: 'Respuestas ordenadas por pasos, bullets o bloques muy legibles.',
} as const;

const prohibitedOptions = {
  standard: 'Evitar inventar, exagerar o sonar mas seguro de lo que realmente sabe.',
  strict: 'Evitar toda afirmacion dudosa y escalar cuando la certeza no alcance.',
  compliance: 'Extremar cuidado con promesas, datos sensibles y autorizaciones.',
} as const;

const testOptions = {
  sales: 'Debe funcionar bien en consultas comerciales, objeciones y cierre.',
  support: 'Debe funcionar bien en preguntas frecuentes, friccion y seguimiento.',
  booking: 'Debe funcionar bien en agenda, cambios y confirmaciones.',
  risk: 'Debe funcionar bien en casos limite, escalamiento y cumplimiento.',
} as const;

const architectSchema = z.object({
  mode: z.enum(['quick', 'advanced']),
  assistantName: z.string().optional(),
  businessName: z.string().optional(),
  objectivePreset: z.enum(Object.keys(objectiveOptions) as [keyof typeof objectiveOptions, ...(keyof typeof objectiveOptions)[]]),
  audiencePreset: z.enum(Object.keys(audienceOptions) as [keyof typeof audienceOptions, ...(keyof typeof audienceOptions)[]]),
  tonePreset: z.enum(Object.keys(toneOptions) as [keyof typeof toneOptions, ...(keyof typeof toneOptions)[]]),
  industryPreset: z.enum(Object.keys(industryOptions) as [keyof typeof industryOptions, ...(keyof typeof industryOptions)[]]),
  offeringPreset: z.enum(Object.keys(offeringOptions) as [keyof typeof offeringOptions, ...(keyof typeof offeringOptions)[]]),
  flowPreset: z.enum(Object.keys(flowOptions) as [keyof typeof flowOptions, ...(keyof typeof flowOptions)[]]),
  escalationPreset: z.enum(Object.keys(escalationOptions) as [keyof typeof escalationOptions, ...(keyof typeof escalationOptions)[]]),
  scopePreset: z.enum(Object.keys(scopeOptions) as [keyof typeof scopeOptions, ...(keyof typeof scopeOptions)[]]),
  knowledgePreset: z.enum(Object.keys(knowledgeOptions) as [keyof typeof knowledgeOptions, ...(keyof typeof knowledgeOptions)[]]),
  toolPreset: z.enum(Object.keys(toolOptions) as [keyof typeof toolOptions, ...(keyof typeof toolOptions)[]]),
  handoffPreset: z.enum(Object.keys(handoffOptions) as [keyof typeof handoffOptions, ...(keyof typeof handoffOptions)[]]),
  outputPreset: z.enum(Object.keys(outputOptions) as [keyof typeof outputOptions, ...(keyof typeof outputOptions)[]]),
  prohibitedPreset: z.enum(Object.keys(prohibitedOptions) as [keyof typeof prohibitedOptions, ...(keyof typeof prohibitedOptions)[]]),
  testPreset: z.enum(Object.keys(testOptions) as [keyof typeof testOptions, ...(keyof typeof testOptions)[]]),
});

type ArchitectFormValues = z.infer<typeof architectSchema>;

interface PromptArchitectCardProps {
  bot?: Bot;
  draftPreview: string;
  promptVersionCount: number;
  meta?: PromptArchitectDraftResponse['meta'] | null;
  isSaving: boolean;
  isGenerating: boolean;
  saveError?: unknown;
  generateError?: unknown;
  onSaveBlueprint: (blueprint: PromptArchitectBlueprint) => void;
  onGenerateDraft: (blueprint: PromptArchitectBlueprint) => void;
}

export function PromptArchitectCard({
  bot,
  draftPreview,
  promptVersionCount,
  meta,
  isSaving,
  isGenerating,
  saveError,
  generateError,
  onSaveBlueprint,
  onGenerateDraft,
}: PromptArchitectCardProps) {
  const form = useForm<ArchitectFormValues>({
    resolver: zodResolver(architectSchema),
    values: toArchitectFormValues(bot),
  });
  const mode = form.watch('mode');
  const providerReady = Boolean(bot?.llmProvider && bot?.llmModel && bot?.llmApiKeySet);
  const hasExistingPrompt = Boolean(bot?.systemPrompt?.trim()) || promptVersionCount > 0;
  const promptLabel = hasExistingPrompt ? 'Generar nuevo borrador' : 'Generar primer prompt';

  if (!bot) {
    return (
      <Card className="mt-5">
        <CardHeader><CardTitle>Arquitecto de prompt</CardTitle></CardHeader>
        <CardContent><EmptyState title="Selecciona un agente" description="Aqui construiremos el brief que alimenta el prompt versionado del bot." /></CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-5">
      <CardHeader className="border-b pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Arquitecto de prompt</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Ahora el creador guía por selecciones cerradas y convierte esas decisiones en un brief listo para generar el prompt.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={providerReady ? 'success' : 'warning'}>{providerReady ? 'Provider listo' : 'Configura provider'}</Badge>
            <Badge tone="info">{bot.llmProvider ?? 'sin provider'} / {bot.llmModel ?? 'sin modelo'}</Badge>
            <Badge tone="neutral">{hasExistingPrompt ? 'Revision sobre prompt actual' : 'Primera version'}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ArchitectMetric
            icon={BrainCircuit}
            label="Modo"
            value={mode === 'advanced' ? 'Avanzado' : 'Rapido'}
            detail={mode === 'advanced' ? 'Mas control y validacion' : 'Configuracion guiada esencial'}
          />
          <ArchitectMetric
            icon={FilePenLine}
            label="Versiones"
            value={String(promptVersionCount)}
            detail={hasExistingPrompt ? 'Ya hay historial publicado' : 'Aun no hay prompt publicado'}
          />
          <ArchitectMetric
            icon={MessageSquareText}
            label="Brief guardado"
            value={bot.identity?.promptArchitect ? 'Si' : 'No'}
            detail="Se conserva dentro de la identidad del agente"
          />
          <ArchitectMetric
            icon={Workflow}
            label="Destino"
            value="Prompt versionado"
            detail="El borrador baja directo al editor de publicacion"
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => onGenerateDraft(toBlueprint(values)))}>
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="flex flex-wrap gap-2">
                <ModeButton active={mode === 'quick'} onClick={() => form.setValue('mode', 'quick', { shouldDirty: true })}>
                  <Sparkles className="h-4 w-4" /> Rapido
                </ModeButton>
                <ModeButton active={mode === 'advanced'} onClick={() => form.setValue('mode', 'advanced', { shouldDirty: true })}>
                  <Wand2 className="h-4 w-4" /> Avanzado
                </ModeButton>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Rapido toma decisiones principales del agente. Avanzado agrega control sobre conocimiento, herramientas, handoff y formato.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre del agente">
                <Input placeholder="Asistente comercial" {...form.register('assistantName')} />
              </Field>
              <Field label="Negocio o marca">
                <Input placeholder="Nombre comercial" {...form.register('businessName')} />
              </Field>
              <Field label="Objetivo del chatbot">
                <Select {...form.register('objectivePreset')}>
                  {renderOptions(objectiveOptions)}
                </Select>
              </Field>
              <Field label="Audiencia principal">
                <Select {...form.register('audiencePreset')}>
                  {renderOptions(audienceOptions)}
                </Select>
              </Field>
              <Field label="Tono del agente">
                <Select {...form.register('tonePreset')}>
                  {renderOptions(toneOptions)}
                </Select>
              </Field>
              <Field label="Tipo de negocio">
                <Select {...form.register('industryPreset')}>
                  {renderOptions(industryOptions)}
                </Select>
              </Field>
              <Field label="Que atiende principalmente">
                <Select {...form.register('offeringPreset')}>
                  {renderOptions(offeringOptions)}
                </Select>
              </Field>
              <Field label="Flujo conversacional">
                <Select {...form.register('flowPreset')}>
                  {renderOptions(flowOptions)}
                </Select>
              </Field>
              <Field label="Regla de escalamiento">
                <Select {...form.register('escalationPreset')}>
                  {renderOptions(escalationOptions)}
                </Select>
              </Field>
              <Field label="Limite principal">
                <Select {...form.register('scopePreset')}>
                  {renderOptions(scopeOptions)}
                </Select>
              </Field>
            </div>

            {mode === 'advanced' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Uso de knowledge">
                  <Select {...form.register('knowledgePreset')}>
                    {renderOptions(knowledgeOptions)}
                  </Select>
                </Field>
                <Field label="Herramientas disponibles">
                  <Select {...form.register('toolPreset')}>
                    {renderOptions(toolOptions)}
                  </Select>
                </Field>
                <Field label="Trigger de handoff">
                  <Select {...form.register('handoffPreset')}>
                    {renderOptions(handoffOptions)}
                  </Select>
                </Field>
                <Field label="Formato de respuesta">
                  <Select {...form.register('outputPreset')}>
                    {renderOptions(outputOptions)}
                  </Select>
                </Field>
                <Field label="Nivel de restriccion">
                  <Select {...form.register('prohibitedPreset')}>
                    {renderOptions(prohibitedOptions)}
                  </Select>
                </Field>
                <Field label="Escenario a optimizar">
                  <Select {...form.register('testPreset')}>
                    {renderOptions(testOptions)}
                  </Select>
                </Field>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={form.handleSubmit((values) => onSaveBlueprint(toBlueprint(values)))}
              >
                <FilePenLine className="h-4 w-4" /> Guardar brief
              </Button>
              <Button disabled={!providerReady || isGenerating} type="submit">
                <Wand2 className="h-4 w-4" /> {promptLabel}
              </Button>
            </div>

            {!providerReady ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Configura provider, modelo y API key del agente para usar el arquitecto con sus propias credenciales.
              </div>
            ) : null}
            {saveError ? <ErrorState error={saveError} /> : null}
            {generateError ? <ErrorState error={generateError} /> : null}
          </form>

          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <p className="font-medium">Salida esperada</p>
              </div>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <p>El creador ya no deja huecos conceptuales amplios: parte de decisiones cerradas y las traduce a instrucciones operativas.</p>
                <p>Siempre deja el borrador en el editor de prompt versionado para revisarlo antes de publicar.</p>
                <p>Si ya existe un prompt, lo toma como base y lo reordena con las nuevas selecciones.</p>
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">Borrador actual</p>
                {meta ? <Badge tone="info">{meta.mode === 'advanced' ? 'Generado en avanzado' : 'Generado en rapido'}</Badge> : null}
              </div>
              {meta ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Usando {meta.provider} / {meta.model} {meta.basedOnExistingPrompt ? 'sobre el prompt actual' : 'como primera version'}.
                </p>
              ) : null}
              {draftPreview.trim() ? (
                <Textarea className="mt-3 min-h-[360px]" readOnly value={draftPreview} />
              ) : (
                <div className="mt-3 rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  Aun no hay borrador en el editor. Selecciona la configuracion y genera uno para revisarlo.
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-slate-700" />
                <p className="font-medium text-slate-900">Criterio de uso</p>
              </div>
              <p className="mt-2 text-sm text-slate-700">
                Este creador sirve para sacar prompts consistentes mas rapido. Si algo muy especifico hace falta, lo ajustamos despues sobre el prompt versionado, no desde preguntas abiertas.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button className="min-w-[132px]" onClick={onClick} type="button" variant={active ? 'default' : 'outline'}>
      {children}
    </Button>
  );
}

function ArchitectMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs uppercase text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-base font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function renderOptions(options: Record<string, string>) {
  return Object.entries(options).map(([value, label]) => (
    <option key={value} value={value}>
      {label}
    </option>
  ));
}

function findPreset<T extends Record<string, string>>(options: T, saved?: string | null, fallback?: keyof T): keyof T {
  const match = Object.entries(options).find(([, value]) => value === saved)?.[0] as keyof T | undefined;
  return match ?? (fallback as keyof T);
}

function toArchitectFormValues(bot?: Bot): ArchitectFormValues {
  const saved = bot?.identity?.promptArchitect;
  return {
    mode: saved?.mode ?? 'quick',
    assistantName: saved?.assistantName ?? bot?.name ?? '',
    businessName: saved?.businessName ?? bot?.branding?.companyName ?? '',
    objectivePreset: findPreset(objectiveOptions, saved?.objective, 'lead_capture'),
    audiencePreset: findPreset(audienceOptions, saved?.audience, 'prospects'),
    tonePreset: findPreset(toneOptions, saved?.tone, 'professional'),
    industryPreset: findPreset(industryOptions, saved?.businessContext, 'services'),
    offeringPreset: findPreset(offeringOptions, saved?.offerings, 'service_quote'),
    flowPreset: findPreset(flowOptions, saved?.happyPath, 'qualify_route'),
    escalationPreset: findPreset(escalationOptions, saved?.escalationRules, 'complex_only'),
    scopePreset: findPreset(scopeOptions, saved?.outOfScope, 'no_promises'),
    knowledgePreset: findPreset(knowledgeOptions, saved?.knowledgePolicy, 'grounded'),
    toolPreset: findPreset(toolOptions, saved?.tools, 'none'),
    handoffPreset: findPreset(handoffOptions, saved?.handoffTriggers, 'high_intent'),
    outputPreset: findPreset(outputOptions, saved?.outputFormat, 'concise'),
    prohibitedPreset: findPreset(prohibitedOptions, saved?.prohibitedContent, 'standard'),
    testPreset: findPreset(testOptions, saved?.testScenarios, 'sales'),
  };
}

function toBlueprint(values: ArchitectFormValues): PromptArchitectBlueprint {
  const blueprint: PromptArchitectBlueprint = {
    mode: values.mode,
    objective: objectiveOptions[values.objectivePreset],
    audience: audienceOptions[values.audiencePreset],
    tone: toneOptions[values.tonePreset],
    businessContext: industryOptions[values.industryPreset],
    offerings: offeringOptions[values.offeringPreset],
    happyPath: flowOptions[values.flowPreset],
    escalationRules: escalationOptions[values.escalationPreset],
    outOfScope: scopeOptions[values.scopePreset],
  };

  if (values.assistantName?.trim()) blueprint.assistantName = values.assistantName.trim();
  if (values.businessName?.trim()) blueprint.businessName = values.businessName.trim();

  if (values.mode === 'advanced') {
    blueprint.knowledgePolicy = knowledgeOptions[values.knowledgePreset];
    blueprint.tools = toolOptions[values.toolPreset];
    blueprint.handoffTriggers = handoffOptions[values.handoffPreset];
    blueprint.outputFormat = outputOptions[values.outputPreset];
    blueprint.prohibitedContent = prohibitedOptions[values.prohibitedPreset];
    blueprint.testScenarios = testOptions[values.testPreset];
    blueprint.successCriteria = 'El agente debe mantener conversaciones utiles, claras y alineadas al objetivo definido, sin inventar datos ni perder el siguiente paso comercial u operativo.';
    blueprint.conversationFlow = `${flowOptions[values.flowPreset]} ${outputOptions[values.outputPreset]}`;
  }

  return blueprint;
}
