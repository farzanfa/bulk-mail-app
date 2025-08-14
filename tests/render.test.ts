import { describe, it, expect } from 'vitest';
import { renderTemplateString, extractVariables } from '@/lib/render';

describe('render', () => {
  it('renders variables', () => {
    const t = 'Hi {{ first_name }} {{ last_name }}';
    const out = renderTemplateString(t, { first_name: 'Ada', last_name: 'Lovelace' });
    expect(out).toBe('Hi Ada Lovelace');
  });
  it('extracts unique variables', () => {
    const t = '{{a}} {{b}} {{a}}';
    expect(extractVariables(t).sort()).toEqual(['a', 'b']);
  });
});


