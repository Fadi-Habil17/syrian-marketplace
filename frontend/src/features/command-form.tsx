'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { mutate, stageFile, fileStatus } from '../lib/actions/market';
import type { ApiSchemas } from '../lib/api/contracts';
import {
  operations,
  resolve,
  type FormSchema,
  type Operation,
  type Parameters,
  type Payload,
  type Value,
} from '../lib/api/registry';
import { inputShape, readInput } from '../lib/api/form-data';
import { actionLabel, enumLabel, errorLabel, field } from '../lib/labels';
import { choose, type Locale } from '../lib/locale';

export type Choices = Record<string, { value: string; label: string }[]>;
type UploadContext = {
  accessClass: ApiSchemas['FileUploadInput']['accessClass'];
  orderId?: string;
  caseId?: string;
};

function Upload({
  locale,
  context,
  onFile,
}: {
  locale: Locale;
  context: UploadContext;
  onFile: (id: string) => void;
}) {
  const [file, setFile] = useState<File>();
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [id, setId] = useState('');
  const key = useRef<string>(undefined);
  async function upload() {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.set('file', file);
      form.set('accessClass', context.accessClass);
      if (context.orderId) form.set('orderId', context.orderId);
      if (context.caseId) form.set('caseId', context.caseId);
      const result = id
        ? await fileStatus(id)
        : await stageFile(form, (key.current ??= crypto.randomUUID()));
      if (!result.ok) {
        setStatus(errorLabel(locale, result.code));
        if (result.code !== 'CONNECTION_ERROR') key.current = undefined;
        return;
      }
      const metadata = result.data as ApiSchemas['FileMetadata'];
      setStatus(enumLabel(locale, metadata.scanStatus));
      setId(metadata.id);
      if (metadata.scanStatus === 'CLEAN') onFile(metadata.id);
    } catch {
      setStatus(choose(locale, 'تعذّر رفع الملف.', 'Could not complete the file upload.'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="upload-row">
      <input
        aria-label={choose(locale, 'اختر ملفاً', 'Choose a file')}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf,application/zip,.zip"
        onChange={(event) => {
          setFile(event.target.files?.[0]);
          setId('');
          setStatus('');
          key.current = undefined;
        }}
      />
      <button className="button soft" type="button" disabled={!file || busy} onClick={upload}>
        {id
          ? choose(locale, 'تحقق من الفحص', 'Check scan status')
          : choose(locale, 'رفع الملف', 'Upload file')}
      </button>
      {status && <span role="status">{status}</span>}
    </div>
  );
}

type FieldProps = {
  schema: FormSchema;
  name: string;
  label: string;
  locale: Locale;
  required?: boolean;
  initial?: Value;
  choices: Choices;
  upload?: UploadContext;
};

function Field({ schema, name, label, locale, required, initial, choices, upload }: FieldProps) {
  const shape = inputShape(schema, resolve);
  const nullable = resolve(schema).variants?.some((item) => resolve(item).type === 'null');
  const [empty, setEmpty] = useState(initial === null);
  const [uploaded, setUploaded] = useState<string>();
  const [enabled, setEnabled] = useState(required || initial !== undefined);
  const optionalObject = shape.type === 'object' && !required;
  const labelText = /^\d+$/.test(label) ? label : field(locale, label);
  const options =
    choices[label] ??
    shape.enum
      ?.filter((item) => item !== null)
      .map((item) => ({
        value: String(item),
        label: enumLabel(locale, String(item)),
      }));
  let control;
  if (shape.type === 'object') {
    const values = initial && typeof initial === 'object' && !Array.isArray(initial) ? initial : {};
    control = (
      <fieldset>
        <legend>{labelText}</legend>
        {optionalObject && (
          <label className="check">
            <input
              type="checkbox"
              checked={!!enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            {choose(locale, 'إضافة التفاصيل', 'Include details')}
          </label>
        )}
        {(!optionalObject || enabled) &&
          Object.entries(shape.properties ?? {}).map(([key, child]) => (
            <Field
              key={key}
              schema={child}
              name={name + '.' + key}
              label={key}
              locale={locale}
              choices={choices}
              required={shape.required?.includes(key)}
              initial={values[key]}
              upload={upload}
            />
          ))}
      </fieldset>
    );
  } else if (shape.type === 'array' && shape.items) {
    control = (
      <ArrayField
        schema={shape}
        name={name}
        label={label}
        locale={locale}
        choices={choices}
        initial={initial}
        required={required}
        upload={upload}
      />
    );
  } else if (shape.const === true) {
    control = (
      <label className="check">
        <input
          name={name}
          type="checkbox"
          value="true"
          required={required}
          defaultChecked={initial === true}
        />
        {labelText}
      </label>
    );
  } else if (shape.const !== undefined) {
    control = <input type="hidden" name={name} value={String(shape.const)} />;
  } else {
    const original = initial === undefined || initial === null ? '' : String(initial);
    const defaultValue =
      shape.format === 'date-time' && original ? toLocalDate(original) : original;
    const isFile = !!upload && /(?:file|photo|attachment|logo).*id|id.*(?:file|photo)/i.test(label);
    const uploadContext = upload && { ...upload, accessClass: deliveryProofClass(upload, label) };
    const type =
      label === 'password'
        ? 'password'
        : shape.format === 'date-time'
          ? 'datetime-local'
          : shape.format === 'email'
            ? 'email'
            : shape.type === 'integer' || shape.type === 'number'
              ? 'number'
              : 'text';
    control = (
      <div className="form-control">
        <label>
          <span>
            {labelText}
            {required && <span aria-hidden="true"> *</span>}
          </span>
          {options || shape.type === 'boolean' ? (
            <select name={name} required={required} defaultValue={defaultValue}>
              <option value="">{choose(locale, 'اختر', 'Select')}</option>
              {(
                options ?? [
                  { value: 'true', label: choose(locale, 'نعم', 'Yes') },
                  { value: 'false', label: choose(locale, 'لا', 'No') },
                ]
              ).map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          ) : (shape.maxLength ?? 0) >= 500 && type === 'text' ? (
            <textarea
              name={name}
              required={required}
              defaultValue={defaultValue}
              minLength={shape.minLength}
              maxLength={shape.maxLength}
              rows={3}
            />
          ) : (
            <input
              key={uploaded ?? 'default'}
              name={name}
              required={required}
              defaultValue={uploaded ?? defaultValue}
              type={type}
              min={shape.minimum}
              max={shape.maximum}
              minLength={shape.minLength}
              maxLength={shape.maxLength}
              step={shape.type === 'number' ? 'any' : undefined}
              autoComplete={label === 'password' ? 'new-password' : undefined}
            />
          )}
        </label>
        {isFile && uploadContext && (
          <Upload locale={locale} context={uploadContext} onFile={setUploaded} />
        )}
      </div>
    );
  }
  if (!nullable) return control;
  return (
    <div>
      <label className="check">
        <input
          type="checkbox"
          name={name + '.__null'}
          value="true"
          checked={empty}
          onChange={(event) => setEmpty(event.target.checked)}
        />
        {labelText} · {choose(locale, 'بلا قيمة', 'No value')}
      </label>
      {!empty && control}
    </div>
  );
}

function deliveryProofClass(upload: UploadContext, label: string): UploadContext['accessClass'] {
  if (label === 'proofFileId' && upload.accessClass === 'FINAL_DELIVERABLE') return 'ORDER_SHARED';
  return upload.accessClass;
}

function toLocalDate(iso: string) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) return '';
  return new Date(value.getTime() - value.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function ArrayField({
  schema,
  name,
  label,
  locale,
  required,
  initial,
  choices,
  upload,
}: FieldProps) {
  const defaults = Array.isArray(initial) ? initial : [];
  const [items, setItems] = useState(() =>
    Array.from(
      { length: Math.max(defaults.length, required ? (schema.minItems ?? 0) : 0) },
      (_, index) => ({ key: index, value: defaults[index] }),
    ),
  );
  const serial = useRef(items.length);
  return (
    <fieldset>
      <legend>{field(locale, label)}</legend>
      {(required || items.length > 0 || initial !== undefined) && (
        <input type="hidden" name={name + '.__array'} value="1" />
      )}
      {items.map((item, index) => (
        <div className="array-entry" key={item.key}>
          <input type="hidden" name={name + '.' + index + '.__item'} value="1" />
          <Field
            schema={schema.items!}
            name={name + '.' + index}
            label={label}
            locale={locale}
            choices={choices}
            required
            initial={item.value}
            upload={upload}
          />
          <button
            type="button"
            className="button outline"
            disabled={items.length <= (required ? (schema.minItems ?? 0) : 0)}
            onClick={() => setItems(items.filter((entry) => entry.key !== item.key))}
          >
            {choose(locale, 'إزالة', 'Remove')}
          </button>
        </div>
      ))}
      <button
        type="button"
        className="button soft"
        disabled={items.length >= (schema.maxItems ?? 30)}
        onClick={() => setItems([...items, { key: serial.current++, value: undefined }])}
      >
        {choose(locale, 'إضافة', 'Add')}
      </button>
    </fieldset>
  );
}

export function CommandForm({
  name,
  locale,
  params = {},
  defaults = {},
  initial = {},
  version,
  choices = {},
  upload,
  go,
  hidden = [],
  open = false,
}: {
  name: Operation;
  locale: Locale;
  params?: Parameters;
  defaults?: Payload;
  initial?: Payload;
  version?: number;
  choices?: Choices;
  upload?: UploadContext;
  go?: 'order' | 'login';
  hidden?: string[];
  open?: boolean;
}) {
  const router = useRouter();
  const route = operations[name];
  const shape = route.body ? resolve(route.body) : null;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ good: boolean; text: string }>();
  const pending = useRef<{
    key: string;
    options: Parameters;
    body: Payload | undefined;
    version?: number;
  }>(undefined);
  const [uncertain, setUncertain] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const options = { ...params };
    for (const key of route.route)
      if (!options[key]) options[key] = String(form.get('route.' + key) ?? '');
    let body = shape
      ? { ...(readInput(form, shape, '', resolve) as Payload), ...defaults }
      : undefined;
    if (name === 'sendMessage' && body && !body.clientMessageId)
      body = { ...body, clientMessageId: crypto.randomUUID() };
    pending.current ??= { key: crypto.randomUUID(), options, body, version };
    setBusy(true);
    setStatus(undefined);
    try {
      const intent = pending.current;
      const response = await mutate(name, intent.options, intent.body, intent.key, intent.version);
      if (!response.ok) {
        const retry = [
          'CONNECTION_ERROR',
          'REQUEST_IN_PROGRESS',
          'TEMPORARILY_UNAVAILABLE',
        ].includes(response.code);
        setUncertain(retry);
        if (!retry) pending.current = undefined;
        setStatus({
          good: false,
          text:
            errorLabel(locale, response.code) +
            (response.requestId ? ' (' + response.requestId + ')' : ''),
        });
        return;
      }
      pending.current = undefined;
      setUncertain(false);
      setStatus({ good: true, text: choose(locale, 'تم الحفظ.', 'Saved.') });
      const data = response.data as { id?: string; order?: { id: string } } | undefined;
      const id = data?.order?.id ?? data?.id;
      if (go === 'login') router.replace('/' + locale + '/login');
      if (id && go === 'order') router.push('/' + locale + '/orders/' + id);

      router.refresh();
    } catch {
      setUncertain(true);
      setStatus({ good: false, text: errorLabel(locale, 'CONNECTION_ERROR') });
    } finally {
      setBusy(false);
    }
  }
  const fields = Object.entries(shape?.properties ?? {}).filter(
    ([key]) => !(key in defaults) && !hidden.includes(key),
  );
  const form = (
    <form className="command-form" onSubmit={submit}>
      <fieldset disabled={busy || uncertain} className="form-fields">
        {route.route
          .filter((key) => !params[key])
          .map((key) => (
            <Field
              key={key}
              schema={{ type: 'string' }}
              name={'route.' + key}
              label={key}
              locale={locale}
              required
              choices={choices}
            />
          ))}
        {fields.map(([key, child]) => (
          <Field
            key={key}
            schema={child}
            name={key}
            label={key}
            locale={locale}
            required={shape?.required?.includes(key)}
            choices={choices}
            initial={initial[key]}
            upload={upload}
          />
        ))}
      </fieldset>
      <button type="submit" className="button primary" disabled={busy}>
        {busy
          ? choose(locale, 'جارٍ الإرسال…', 'Submitting…')
          : uncertain
            ? choose(locale, 'تحقق بإعادة نفس الطلب', 'Retry the same request')
            : actionLabel(locale, name)}
      </button>
      {status && (
        <p role={status.good ? 'status' : 'alert'} className={status.good ? 'success' : 'notice'}>
          {status.text}
        </p>
      )}
    </form>
  );
  return open ? (
    form
  ) : (
    <details className="command">
      <summary>{actionLabel(locale, name)}</summary>
      {form}
    </details>
  );
}
